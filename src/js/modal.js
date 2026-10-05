function showModal(message, buttons) {
    // Only one modal at a time
    if (document.getElementById("modal-backdrop")) {return;}

    const backdrop = document.createElement("div");
    backdrop.id = "modal-backdrop";

    const box = document.createElement("div");
    box.id = "modal-box";

    const text = document.createElement("div");
    text.textContent = message;
    box.appendChild(text);

    const buttonRow = document.createElement("div");
    buttonRow.className = "modal-buttons";

    buttons.forEach(({ label, onClick }) => {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.addEventListener("click", () => {
            backdrop.remove();
            if (onClick) {onClick();}
        });
        buttonRow.appendChild(btn);
    });

    box.appendChild(buttonRow);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
}

function showAlert(message) {
    showModal(message, [{ label: "OK" }]);
}

function showConfirm(message, onConfirm) {
    showModal(message, [
        { label: "OK", onClick: onConfirm },
        { label: "Cancel" },
    ]);
}
