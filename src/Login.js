import React from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Redirigir a Home con datos del usuario
            navigate("/home", {
                state: {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                },
            });

        } catch (error) {
            alert("Error al iniciar sesión: " + error.message);
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "100px" }}>
            <h1>Inicia sesión en GoLife</h1>
            <button onClick={handleLogin}>Iniciar sesión con Google</button>
        </div>
    );
}

export default Login;
