document.addEventListener('DOMContentLoaded', function () {

    // Funzione per caricare i dottori dal server
    function loadDoctors() {
        var doctorListElement = document.getElementById('doctorList');
        doctorListElement.innerHTML = '';

        // Effettua una richiesta al server per ottenere la lista dei dottori
        fetch('/doctors')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Errore durante il caricamento dei dottori');
                }
                return response.json();
            })
            .then(function (doctors) {
                // Se non ci sono dottori disponibili, mostra un messaggio
                if (doctors.length === 0) {
                    showMessage('Nessun dottore disponibile al momento.');
                    return;
                }

                // Aggiungi un div per ogni dottore
                for (var i = 0; i < doctors.length; i++) {
                    var doctorDiv = createDoctorElement(doctors[i]);
                    doctorListElement.appendChild(doctorDiv);
                }

                // Aggiungi l'evento di click ai pulsanti "Prenota una visita"
                addBookingEventListeners();
            })
            .catch(function () {
                showMessage('Errore durante il caricamento dei dottori. Riprova più tardi.');
            });
    }

    // Funzione per creare un elemento HTML per ogni dottore
    function createDoctorElement(doctor) {
        var doctorDiv = document.createElement('div');
        doctorDiv.classList.add('doctor');
        doctorDiv.innerHTML = '<h2>' + doctor.specialization + '</h2>' +
            '<img src="' + doctor.image_path + '" alt="Immagine di ' + doctor.name +
            '" class="doctor-image">' + '<p class="name">' + doctor.name + '</p>' +
            '<button class="details-btn" data-doctor-id="' + doctor.id + '"> Prenota una visita</button>';
        return doctorDiv;
    }

    // Funzione per aggiungere gli event listener ai pulsanti "Prenota una visita"
    function addBookingEventListeners() {
        var buttons = document.getElementsByClassName('details-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                var doctorId = this.getAttribute('data-doctor-id');
                if (doctorId) {
                    window.location.href = '/booking.html?doctorId=' + doctorId;
                } else {
                    console.error('ID del dottore non valido.');
                }
            });
        }
    }

    // Funzione per mostrare messaggi all'utente
    function showMessage(message) {
        var doctorListElement = document.getElementById('doctorList');
        doctorListElement.innerHTML = '<p>' + message + '</p>';
    }

    // Carica i dottori all'avvio della pagina
    loadDoctors();
});