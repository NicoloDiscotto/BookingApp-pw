document.addEventListener('DOMContentLoaded', function () {

    // Funzione per gestire il logout
    function Logout() {
        const isConfirmed = confirm('Sei sicuro di voler uscire?');

        if (isConfirmed) {
            // Invia una richiesta POST al server per effettuare il logout
            fetch('/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
                .then(function (response) {
                    // Se la risposta del server è OK, reindirizza alla homepage
                    if (response.ok) {
                        window.location.href = '/';
                    } else {
                        response.json().then(function (result) {
                            alert('Errore durante il logout: ' + result.message);
                        });
                    }
                })
                .catch(function (error) {
                    alert('Errore di rete. Riprova più tardi.');
                    console.error(error);
                });
        }
    }

    // Aggiungi l'event listener per il pulsante di logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', Logout);
    }

    // Aggiungi l'event listener per il pulsante "Le Mie Prenotazioni"
    const myBookingsButton = document.getElementById('myBookingsButton');
    if (myBookingsButton) {
        myBookingsButton.addEventListener('click', function () {
            window.location.href = '/mybooking.html';
        });
    }
});