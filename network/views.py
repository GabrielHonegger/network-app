from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post, Follow, Like

@csrf_exempt
@login_required
def update_post(request):
    if request.method == "POST":
        post_id = request.POST.get('post_id')
        new_content = request.POST.get('content')
        post = get_object_or_404(Post, id=post_id)
        if request.user == post.user:
            post.content = new_content
            post.save()
            return JsonResponse({"status": "success"})
    return JsonResponse({"error": "POST request required."}, status=400)

@csrf_exempt
@login_required
def update_like(request):
    if request.method == "POST":
        user = request.user
        post_id = request.POST.get('post_id')
        post = Post.objects.get(id=post_id)
        liked = request.POST.get('liked').capitalize() == "True"
        try:
            like = Like.objects.get(user=user, post=post)
            like.delete()
        except:
            new_like = Like(user=user, post=post, liked=liked)
            new_like.save()

        like_count = Like.objects.filter(post=post, liked=True).count()

        return JsonResponse({"status": "success", "like_count": like_count})
    return JsonResponse({"error": "POST request required."}, status=400)

def index(request):
    if request.method == "POST":
        user = request.user
        content = request.POST["post-content"]

        new_post = Post(user=user, content=content)

        new_post.save()
        
    posts = Post.objects.all().order_by('-timestamp')

    if request.user.is_authenticated:
        for post in posts:
            post.liked = Like.objects.filter(user=request.user, post=post)

    paginator = Paginator(posts, 10) # Show 10 posts per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, "network/index.html", {
        "page_obj": page_obj
    })

def profile(request, username):
    if request.user.is_authenticated:
        user = request.user
    followed_user = get_object_or_404(User, username=username)

    if request.method == "POST":
        try:
            follow = Follow.objects.get(user=user, followed_user=followed_user)
            follow.delete()
        except:
            Follow.objects.create(user=user, followed_user=followed_user)

        return redirect('profile', username=username)
    
    profile = User.objects.get(username=username)
    posts = profile.posts.all().order_by('-timestamp')

    if request.user.is_authenticated:
        for post in posts:
            post.liked = Like.objects.filter(user=request.user, post=post)

    paginator = Paginator(posts, 10) # Show 10 posts per page

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if request.user.is_authenticated:
        is_following = Follow.objects.filter(user=user, followed_user=followed_user).exists()
    else:
        is_following = False
    return render(request, "network/profile.html", {
        "profile": profile,
        "page_obj": page_obj,
        "is_following": is_following
    })

@login_required
def following(request):
    user = request.user
    following = user.follows.all().values_list('followed_user', flat=True)
    following_posts = Post.objects.filter(user_id__in=following)

    if request.user.is_authenticated:
        for post in following_posts:
            post.liked = Like.objects.filter(user=request.user, post=post)

    paginator = Paginator(following_posts, 10) # Show 10 posts per page

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, "network/following.html", {
        "page_obj": page_obj,
        "user": user
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
