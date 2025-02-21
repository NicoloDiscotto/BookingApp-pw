document.addEventListener('DOMContentLoaded', function () {
    // Carica le prenotazioni al caricamento della pagina
    getBookings();

    // Funzione per recuperare le prenotazioni dall'API
    function getBookings() {
        try {
            // Richiesta GET per recuperare le prenotazioni
            const response = fetch('/my-bookings', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            response.then(function (res) {
                return res.json();
            }).then(function (bookings) {
                const bookingsList = document.getElementById('bookings-list');
                const noBookingsMessage = document.getElementById('no-bookings-message');

                // Verifica se ci sono prenotazioni
                if (Array.isArray(bookings) && bookings.length > 0) {
                    noBookingsMessage.style.display = 'none';

                    // Ordina le prenotazioni per data
                    bookings.sort(function (a, b) {
                        return new Date(a.date) - new Date(b.date);
                    });

                    let hasUpcomingBookings = false;

                    // Aggiungi ogni prenotazione alla lista
                    for (let i = 0; i < bookings.length; i++) {
                        const booking = bookings[i];
                        const bookingDateTime = new Date(booking.date + 'T' + booking.time_slot.split('-')[0] + ':00');
                        const italianTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));

                        // Ignora le prenotazioni passate
                        if (bookingDateTime < italianTime) {
                            continue;
                        }

                        hasUpcomingBookings = true;
                        const isWithin24Hours = isBookingWithin24Hours(bookingDateTime);

                        const bookingElement = createBookingElement(booking, isWithin24Hours);
                        bookingsList.appendChild(bookingElement);
                    }

                    if (!hasUpcomingBookings) {
                        noBookingsMessage.style.display = 'block';
                    }
                } else {
                    noBookingsMessage.style.display = 'block';
                }
            }).catch(function (error) {
                alert('Errore di connessione al server. Riprova più tardi.');
                console.error(error);
            });
        } catch (error) {
            alert('Errore di connessione al server. Riprova più tardi.');
            console.error(error);
        }
    }

    // Funzione per creare l'elemento della prenotazione
    function createBookingElement(booking, isWithin24Hours) {
        const bookingElement = document.createElement('div');
        bookingElement.classList.add('booking', 'booking-card');
        bookingElement.setAttribute('data-doctor-id', booking.doctor_id);

        bookingElement.innerHTML = '<h3>Visita con ' + booking.name + '</h3>' +
            '<p>Data: ' + formatDate(booking.date) + '</p>' +
            '<p>Orario: ' + booking.time_slot + '</p>' +
            '<p>ID della prenotazione: ' + booking.booking_id + '</p>' +
            '<button class="edit-booking-button" data-booking-id="' + booking.booking_id + '" ' +
            (isWithin24Hours ? 'disabled' : '') + '>Modifica</button>' +
            '<button class="cancel-booking-button" data-booking-id="' + booking.booking_id + '" ' +
            (isWithin24Hours ? 'disabled' : '') + '>Annulla</button>';

        // Aggiungi messaggio di avviso se la prenotazione è entro le 24 ore
        if (isWithin24Hours) {
            const message = document.createElement('p');
            message.classList.add('warning-message');
            message.textContent = 'Non puoi modificare o cancellare questa prenotazione nelle 24 ore precedenti.';
            bookingElement.appendChild(message);
        }

        return bookingElement;
    }

    // Funzione per modificare il formato della data in GG-MM-AAAA
    function formatDate(dateString) {
        const parts = dateString.split('-');
        const day = parts[2];
        const month = parts[1];
        const year = parts[0];
        return day + '-' + month + '-' + year;
    }

    // Funzione per verificare se la prenotazione è entro le 24 ore
    function isBookingWithin24Hours(bookingDateTime) {
        const now = new Date();
        const timeDifference = bookingDateTime - now;
        return timeDifference < 24 * 60 * 60 * 1000;
    }

    // Aggiungi gli event listener per modificare e annullare la prenotazione
    document.getElementById('bookings-list').addEventListener('click', function (event) {
        // Gestione del clic sul pulsante "Modifica"
        if (event.target.classList.contains('edit-booking-button')) {
            const bookingId = event.target.getAttribute('data-booking-id');
            const doctorId = event.target.closest('.booking').getAttribute('data-doctor-id');
            window.location.href = '/booking.html?doctorId=' + doctorId + '&bookingId=' + bookingId;
        }

        // Gestione del clic sul pulsante "Annulla"
        if (event.target.classList.contains('cancel-booking-button')) {
            const bookingId = event.target.getAttribute('data-booking-id');
            cancelBooking(bookingId);
        }
    });

    // Funzione per cancellare una prenotazione
    function cancelBooking(bookingId) {
        if (!confirm('Sei sicuro di voler annullare questa prenotazione?')) {
            return;
        }

        // Esegue la richiesta al server per cancellare la prenotazione
        fetch('/delete-booking/' + bookingId, { method: 'DELETE' })
            .then(response => response.json())
            .then(result => {
                if (result.message) {
                    alert(result.message);
                }
                if (result.success) {
                    removeBookingElement(bookingId);
                    location.reload();
                }
            })
            .catch(error => {
                alert('Errore di connessione: ' + error.message);
            });
    }

    // Funzione per rimuovere l'elemento della prenotazione
    function removeBookingElement(bookingId) {
        const bookingElement = document.querySelector('.booking[data-booking-id="' + bookingId + '"]');
        if (bookingElement) {
            bookingElement.remove();
        }
    }
});