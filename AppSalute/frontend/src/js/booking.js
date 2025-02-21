document.addEventListener('DOMContentLoaded', function () {
    // Recupera i parametri dalla query string dell'URL
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doctorId');
    const bookingId = urlParams.get('bookingId');

    // Verifica la presenza dei parametri necessari
    if (!doctorId && !bookingId) {
        alert('Errore: ID del dottore o della prenotazione non trovati.');
        window.location.href = '/index';
        return;
    }

    // Se bookingId è presente carica la prenotazione esistente
    if (bookingId) {
        loadBookingDetails(bookingId);
    }

    // Carica le fasce orarie disponibili per la data selezionata
    const calendar = document.getElementById('calendar');
    calendar.addEventListener('change', function (event) {
        const selectedDate = event.target.value;
        loadTimeSlots(selectedDate);
    });

    // Gestione prenotazione
    const bookButton = document.getElementById('bookButton');
    bookButton.addEventListener('click', function () {
        handleBooking(doctorId, bookingId);
    });

    // Funzione per caricare i dettagli della prenotazione esistente
    function loadBookingDetails(bookingId) {
        fetch('/get-booking/' + bookingId) // Recupera i dettagli della prenotazione dal server
            .then(function (response) {
                return response.json();
            })
            .then(function (booking) {
                const calendar = document.getElementById('calendar');
                calendar.value = booking.date;

                const selectedTimeSlot = document.querySelector('input[value="' + booking.time_slot + '"]');
                if (selectedTimeSlot) {
                    selectedTimeSlot.checked = true;
                }
            })
            .catch(function (error) {
                alert('Errore nel caricamento della prenotazione');
                console.error(error);
            });
    }

    // Funzione per caricare le fasce orarie disponibili per una data selezionata
    function loadTimeSlots(date) {
        if (!doctorId) {
            alert('Errore: ID del dottore non trovato.');
            return;
        }

        // Recupera le fasce orarie disponibili dal server
        fetch('/available-time-slots?doctorId=' + doctorId + '&date=' + date)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                updateTimeSlots(data.availableSlots);
            })
            .catch(function (error) {
                alert('Errore nel recupero delle fasce orarie disponibili.');
                console.error(error);
            });
    }

    // Funzione per aggiornare la lista delle fasce orarie
    function updateTimeSlots(slots) {
        const timeSlotsContainer = document.getElementById('time-slots');
        timeSlotsContainer.innerHTML = '';

        if (slots.length === 0) {
            timeSlotsContainer.innerHTML = '<p>Non ci sono fasce orarie disponibili per la data selezionata.</p>';
        } else {
            // Crea un input radio per ogni fascia oraria disponibile
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                const slotDiv = document.createElement('div');
                slotDiv.classList.add('time-slot');
                slotDiv.innerHTML = '<input type="radio" name="timeSlot" value="' + slot + '" id="' + slot + '">' +
                    '<label for="' + slot + '">' + slot + '</label>';
                timeSlotsContainer.appendChild(slotDiv);
            }
        }
        const bookButton = document.getElementById('bookButton');
        bookButton.disabled = false;
    }

    // Funzione per gestire la prenotazione
    function handleBooking(doctorId, bookingId) {
        // Recupera la data e la fascia oraria selezionata
        const date = document.getElementById('calendar').value;
        const timeSlot = document.querySelector('input[name="timeSlot"]:checked')?.value;

        if (!date || !timeSlot) {
            alert('Per favore, seleziona una data e una fascia oraria.');
            return;
        }

        // Verifica che la data selezionata non sia nel passato
        const italianTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
        const [startTime] = timeSlot.split('-');
        const bookingDateTime = new Date(`${date}T${startTime}:00`);
        const localizedBookingDateTime = new Date(bookingDateTime.toLocaleString("en-US", { timeZone: "Europe/Rome" }));

        if (bookingDateTime < italianTime) {
            alert('Non puoi selezionare una data o un orario nel passato.');
            return;
        }

        // Disabilita il pulsante di prenotazione durante il caricamento
        const bookButton = document.getElementById('bookButton');
        bookButton.disabled = true;

        let endpoint;
        if (bookingId) {
            // Endpoint per modificare una prenotazione esistente
            endpoint = '/update-booking/' + bookingId;
        } else {
            // Endpoint per una nuova prenotazione
            endpoint = '/book-appointment';
        }

        let method;
        if (bookingId) {
            // Metodo HTTP per aggiornare la prenotazione
            method = 'PUT';
        } else {
            // Metodo HTTP per creare la prenotazione
            method = 'POST';
        }

        const body = JSON.stringify({ date: date, timeSlot: timeSlot, doctorId: doctorId });

        // Invia la richiesta al server
        fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: body
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (result) {
                if (result.success) {
                    if (bookingId) {
                        alert('Prenotazione modificata con successo!');
                    } else {
                        alert('Prenotazione avvenuta con successo!');
                    }
                    window.location.href = '/index';
                } else {
                    alert('Errore nella prenotazione: ' + result.message);
                }
            })
            .catch(function (error) {
                alert('Errore di connessione al server. Riprova più tardi.');
                console.error(error);
            });
    }
});
