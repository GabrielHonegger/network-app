document.addEventListener('DOMContentLoaded', function() {
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value

    document.querySelectorAll('.comment-button').forEach(function(comment_button) {
        comment_button.addEventListener('click', function() {
            //let commentTab = false;

            let post = this.closest('.parent-post');
            let textarea = document.createElement('textarea');
            post.appendChild(textarea);
        })
    })

    document.querySelectorAll('.like-button').forEach(function(like_button) {
        like_button.addEventListener('click', function() {
            let updateUrl = this.getAttribute('data-url');
            const imgElement = this.querySelector('img');
            postId = this.getAttribute('data-id');
            if (this.innerHTML.slice(-4) === "Like") {
                fetch(updateUrl, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrftoken
                    },
                    body: new URLSearchParams({
                        'post_id': postId,
                        'liked': true
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        console.log(`Post ${like_button.dataset.id} was liked`);

                        let likedImage = imgElement.getAttribute('data-image');
                        imgElement.setAttribute('src', likedImage);

                        let newText = this.innerHTML.slice(0, -4);
                        newText += "Unlike";
                        this.innerHTML = newText;

                        const likeCount = document.getElementById(`like-${postId}`);
                        likeCount.innerHTML = `${data.like_count} Likes`;
                    } else {
                        alert('Failed to like post!');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    console.log('An error occured, please try again.');
                })
            } else {
                fetch(updateUrl, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrftoken
                    },
                    body: new URLSearchParams({
                        'post_id': postId,
                        'liked': false
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        console.log(`Post ${like_button.dataset.id} was unliked`);

                        let unlikedImage = imgElement.getAttribute('data-image-src');
                        imgElement.setAttribute('src', unlikedImage);

                        let newText = this.innerHTML.slice(0, -6);
                        newText += "Like";
                        this.innerHTML = newText;

                        const likeCount = document.getElementById(`like-${postId}`);
                        likeCount.innerHTML = `${data.like_count} Likes`;
                    } else {
                        alert('Failed to unlike post!');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    console.log('An error occured, please try again.');
                })
            }
        })
    })

    document.querySelectorAll('.edit').forEach(function(edit_button) {
        edit_button.addEventListener('click', function() {
            console.log('cliked!');
            let post = this.closest('.post');
            let updateUrl = this.getAttribute('data-url'); // Retrieve URL from data attribute
    
            this.style.display = 'none';
    
            contentDiv = post.querySelector('.content');
    
            content = contentDiv.innerHTML;
    
            let textarea = document.createElement('textarea');
            textarea.className = 'content border border-gray-400 rounded-lg w-full mb-2 p-2';
            textarea.innerHTML = content;
            textarea.setAttribute('rows', '3');
    
            contentDiv.parentNode.replaceChild(textarea, contentDiv);
    
            let saveButton = document.createElement('button');
            saveButton.innerHTML = 'Save';
            saveButton.className = 'bg-blue-500 rounded-lg text-white px-4 py-2 mb-2 cursor-pointer hover:bg-blue-600';
            saveButton.onclick = function() {
                let updatedContent = textarea.value;
                let postId = post.dataset.id;

                let fetchUrl = edit_button.value;

                console.log(fetchUrl);

                fetch(updateUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrftoken
                    }, 
                    body: new URLSearchParams({
                        'post_id': postId,
                        'content': updatedContent
                    })
                })
                .then(response => response.json())
                .then(data =>{
                    if (data.status === 'success') {
                        let newContentDiv = document.createElement('div');
                        newContentDiv.className = 'content';
                        newContentDiv.innerHTML = updatedContent;

                        textarea.parentNode.replaceChild(newContentDiv, textarea);
                        saveButton.remove();
                        edit_button.style.display = 'block';
                    } else {
                        alert('Failed to save post!');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert("An error occured. Please try again.");
                });
            }
    
            textarea.parentNode.insertBefore(saveButton, textarea.nextElementSibling);
    
        });
    });
});