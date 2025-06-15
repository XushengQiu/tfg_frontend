import React from "react";
import { useLocation } from "react-router-dom";

function Home() {
    const location = useLocation();
    const { displayName, email, photoURL } = location.state || {};

    return (
        <div style={{ textAlign: "center", marginTop: "100px" }}>
            <h1>Bienvenida, {displayName || "desconocid@"}</h1>
            <p>{email}</p>
            {photoURL && <img src={photoURL} alt="Foto de perfil" style={{ borderRadius: "50%" }} />}
        </div>
    );
}

export default Home;
