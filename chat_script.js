// =================================
// GEMINI API KONFIGURĀCIJA
// =================================

// SVARĪGI: Aizstāt ar savu Gemini API atslēgu!
const GEMINI_API_KEY = 'GEMINI_API_KEY_HERE';
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Pielāgotais uzvednes teksts filmu ieteikumiem
const CUSTOM_PROMPT = `Tu esi sirsnīgs filmu ieteikumu AI, kurš runā latviešu valodā un īsti saprot cilvēku noskaņojumus. Tu esi kā labākais draugs, kas vienmēr zina, kādu filmu ieteikt.
Galvenās prasības:
Personība: Esi silts, empātisks un nedaudz humoristisks. Runā sarunvalodā, it kā tiktos ar draugu.
Atbildes struktūra (SVARĪGI - ievēro 900 simbolu limitu!):

Īss empātisks ievads (1 teikums)
3-5 filmas ar īsiem, konkrētiem aprakstiem
Vienkāršs noslēguma jautājums

Filmu formāts:
"Nosaukums (gads): Īss (20-30 vārdu) apraksts + kāpēc atbilst noskaņojumam."
Reaģē uz lietotāja atsauksmēm:

Ja patīk ieteikums → apstiprina gaumi un piedāvā līdzīgas
Ja nepatīk → noskaidro, kas nepatika, un piedāvā citu virzienu
Ja jau redzējis → atzīmē labu gaumi un iesaka līdzīgas

Sarunas loģika:

Ja lietotājs sveicina/runā vispārīgi → atbildi draudzīgi un pajautā par noskaņojumu
Ja apraksta noskaņojumu/situāciju → dod filmu ieteikumus
Ja komentē iepriekšējos ieteikumus → reaģē un piedāvā jaunus
Izmanto savu intuīciju, lai saprastu, kad ir piemērots laiks ieteikumiem

Svarīgi:

Nepārsniedz 900 simbolus!
Vienmēr paskaidro KĀPĒC filma atbilst
Uzdod vienu vienkāršu jautājumu beigās
Esi īss, bet sirsnīgs`;

// =================================
// ČATA FUNKCIONALITĀTE
// =================================

// Iegūst nepieciešamos DOM elementus
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Enter taustiņa apstrāde ziņojuma sūtīšanai
messageInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Galvenā funkcija ziņojuma sūtīšanai
async function sendMessage() {
  const message = messageInput.value.trim();

  // Pārbauda, vai ziņojums nav tukšs
  if (!message) return;

  // Pārbauda API atslēgas esamību
  if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    // alert(
    //   'Lūdzu, aizstāj GEMINI_API_KEY programmas kodā ar savu īsto API atslēgu!'
    // );
    return;
  }

  // Pievieno lietotāja ziņojumu čatam
  addMessage(message, 'user');

  // Notīra ievades lauku un atspējo pogu
  messageInput.value = '';
  sendButton.disabled = true;

  // Parāda ielādes indikatoru
  showLoading();

  try {
    // Sūta pieprasījumu uz Gemini API
    const response = await callGeminiAPI(message);

    // Paslēpj ielādes indikatoru
    hideLoading();

    // Pievieno AI atbildi čatam
    addMessage(response, 'ai');
  } catch (error) {
    // Kļūdas apstrāde
    console.error('Kļūda:', error);
    hideLoading();
    addMessage(
      'Šī ir demo versija bez MI atbalsta. Lai izmēģinātu strādājošu čatu ar MI, pajautājiet :)',
      'ai'
    );
  }

  // Atļauj atkal sūtīt ziņojumus
  sendButton.disabled = false;
  messageInput.focus();
}

// =================================
// GEMINI API INTEGRĀCIJA
// =================================

// Funkcija, kas saziņas ar Gemini API (ATKĀRTOTI IZMANTOJAMA!)
async function callGeminiAPI(userMessage) {
  // Sagatavo pilno uzvedni ar lietotāja ziņojumu
  const fullPrompt = CUSTOM_PROMPT + '\n\nLietotāja ziņojums: ' + userMessage;

  // Sagatavo API pieprasījuma datus
  const requestData = {
    contents: [
      {
        parts: [
          {
            text: fullPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  };

  // Sūta pieprasījumu uz Gemini API
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  // Pārbauda, vai pieprasījums bija veiksmīgs
  if (!response.ok) {
    throw new Error(`API kļūda: ${response.status}`);
  }

  // Apstrādā API atbildi
  const data = await response.json();

  // Pārbauda, vai atbilde satur nepieciešamos datus
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error('Neparedzēta API atbildes struktūra');
  }
}

// =================================
// ČATA INTERFEISA FUNKCIJAS
// =================================

// Pievieno ziņojumu čata konteineram
function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;

  if (sender === 'user') {
    // Replace newlines with <br> for user messages
    messageDiv.innerHTML = `<strong>Jūs:</strong><br>${text.replace(
      /\n/g,
      '<br>'
    )}`;
  } else {
    // Parse Markdown and sanitize for AI messages
    const html = DOMPurify.sanitize(marked.parse(text));
    messageDiv.innerHTML = `<strong>🤖 CineMood AI:</strong><br>${html}`;
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Parāda ielādes indikatoru
function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message ai-message loading';
  loadingDiv.id = 'loading-message';
  loadingDiv.innerHTML = `
        <strong>🤖 CineMood AI:</strong><br>
        <span class="loading">
            Meklēju perfektās filmas Jums
            <span class="loading-dots">
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
            </span>
        </span>
    `;

  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Paslēpj ielādes indikatoru
function hideLoading() {
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// =================================
// INICIALIZĀCIJA
// =================================

// Fokusē uz ievades lauku, kad lapa ir ielādēta
window.addEventListener('load', function () {
  messageInput.focus();
});
