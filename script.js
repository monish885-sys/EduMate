function toggleEdit(field) {
    const display = document.getElementById(`${field}-display`);
    const input = document.getElementById(`${field}-input`);
    const editBtn = document.querySelector(`.edit-btn[onclick="toggleEdit('${field}')"]`);

    if (input.style.display === "none") {
        display.style.display = "none";
        input.style.display = "inline";
        editBtn.textContent = "Cancel";
    } else {
        display.style.display = "inline";
        input.style.display = "none";
        editBtn.textContent = "Edit";
    }
}

function saveChanges() {
    // The saveChanges function is now managed by the form submission
    // This function is kept for structure but can be empty or removed
}


function sendConnectionRequest(userId, goal, subName) {
    fetch('/api/connections/request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, goal, subName }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Connection request sent successfully!');
        } else {
            alert('Failed to send connection request.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}