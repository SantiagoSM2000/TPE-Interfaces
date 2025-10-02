document.addEventListener('DOMContentLoaded', () => {
    const passwordIcon = document.querySelector("#password-icon");
    const repeatPasswordIcon = document.querySelector("#repeat-password-icon");
    const passwordInput = document.querySelector("#Password");
    const repeatPasswordInput = document.querySelector("#repeat-password");

    passwordIcon.addEventListener("click", (e) => togglePasswordVisibility(e.target, passwordInput));
    repeatPasswordIcon.addEventListener("click", (e) => togglePasswordVisibility(e.target, repeatPasswordInput));

    function togglePasswordVisibility(icon, input) {
        if(icon.getAttribute("data-open")=="false"){
            icon.src="assets/svg/eye-closed.svg";
            icon.setAttribute('data-open', 'true');
            input.type = "text";

        }else{
            icon.src="assets/svg/eye-open.svg";
            icon.setAttribute('data-open', 'false');
            input.type = "password";
        }
    }
});