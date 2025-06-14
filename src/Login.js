import React from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./firebase";

function Login() {
    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            alert("Inicio de sesión con Google exitoso");
        } catch (error) {
            console.error(error);
            alert("Error al iniciar sesión con Google: " + error.message);
        }
    };

    return (
        <div>
            <h2>Inicia sesión</h2>
            <button onClick={handleGoogleLogin}>Iniciar sesión con Google</button>
        </div>
    );
}

export default Login;