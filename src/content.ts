import {getThreadsDetails, ThreadDetails} from "./askfm/api.ts"


const PLACEHOLDER_AVATAR = "http://placekitten.com/250/250"

const extractQuestionIdFromHref = (href: string | null) => {
    if (!href) return null;
    const match = href.match(/\/answers\/(\d+)/);
    return match ? match[1] : null;
};

const buildChatHtml = (chatDiv: HTMLDivElement, chat: ThreadDetails) => {
  // add the first message
  chatDiv.innerHTML = `
    <div class="chat-header" style="
      padding: 10px;
      background-color: #ee1144;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;">

      <h2>Chat Messages</h2>
    </div>
    <div class="chat-messages" style="
      padding: 10px;
      max-height: 200px;
      overflow-y: auto;
      border-radius: 10px;
      margin-top: 10px;">

      <div class="messages-container" style="display: flex; flex-direction: column;"></div>
    </div>
    <div class="chat-input" style="
      padding: 10px;
      display: flex;
      margin-top: 10px;
      justify-content: space-between;">

      <input v-model="newMessage" type="text" placeholder="Type your message..." style="
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 5px;">

      <button onclick="sendMessage" style="
        padding: 8px;
        background-color: #ee1144;
        color: #fff;
        border: none;
        cursor: pointer;">Send</button>
    </div>
  `;

  const messagesContainer = chatDiv.querySelector(".messages-container");

  // add the first msg
  if (messagesContainer) {
    const isOwnClass = chat.messages[0].isOwn ? "own-message" : "other-message";
    const avatarSrc = chat.messages[0].avatarUrl || PLACEHOLDER_AVATAR;

    messagesContainer.innerHTML += `
      <div class="message ${isOwnClass}" style="
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        background-color: ${chat.messages[0].isOwn ? '#e0f0e0' : '#f0f0f0'};
        border-radius: 10px;
        padding: 10px;">

        <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          margin-right: 10px;">

        <div class="message-text" style="flex: 1;">
          ${chat.answer.body}
          <div class="small-date" style="font-size: 10px; color: #666; text-align: ${chat.messages[0].isOwn ? 'right' : 'left'};">
            ${new Date(chat.messages[0].createdAt * 1000).toLocaleString()}
          </div>
        </div>
      </div>
    `;
  }

  chat.messages.slice(1).forEach((msg) => {
    if (messagesContainer) {
      const isOwnClass = msg.isOwn ? "own-message" : "other-message";
      const avatarSrc = msg.avatarUrl || PLACEHOLDER_AVATAR;

      messagesContainer.innerHTML += `
        <div class="message ${isOwnClass}" style="
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          background-color: ${msg.isOwn ? '#e0f0e0' : '#f0f0f0'};
          border-radius: 10px;
          padding: 10px;">

          <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
            width: 30px;
            height: 30px;
            border-radius: 50%;
            margin-right: 10px;">

          <div class="message-text" style="flex: 1;">
            ${msg.text}
            <div class="small-date" style="font-size: 10px; color: #666; text-align: ${msg.isOwn ? 'right' : 'left'};">
              ${new Date(msg.createdAt * 1000).toLocaleString()}
            </div>
          </div>
        </div>
      `;
    }
  });
};

const showChat = (questionHTML: Element | null , chat: ThreadDetails) => {
    
    // change the +1 messages to Reload
    if (questionHTML) {
        const readAllMessages = questionHTML?.querySelector('[data-tracking-screen="Web2app_Chat_function"]')
        if (readAllMessages) {
            readAllMessages.textContent = "Reload"

            readAllMessages.previousElementSibling?.remove()
            
            // append the new html
            const chatDiv = document.createElement("div")

            buildChatHtml(chatDiv, chat)

            // append the first chat message
            readAllMessages.previousElementSibling?.after(chatDiv)
        }
    }
}

const handleQuestionClick = async (event: Event) => {
    // get the question id from that element : under that class streamItem_meta
    const article = (event.currentTarget as HTMLElement).closest('.item.streamItem-answer');
    if (article) {
        const questionLink = article.querySelector('.streamItem_meta');
        const href = questionLink!.getAttribute('href');
        const questionId = extractQuestionIdFromHref(href);

        console.log("Trying to get chats for : ", questionId)

        const chat = await getThreadsDetails(questionId!)
        showChat(article, chat)
    }
};

const debounce = (func: () => void, delay: number) => {
    let timeoutId: number;

    return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(func, delay);
    };
};

const hasEventListener = (element: EventTarget, eventType: string, callback: EventListenerOrEventListenerObject) => {
    const eventListeners = (element as any).__events || {};
    return eventListeners[eventType]?.some((listener: EventListenerOrEventListenerObject) => listener === callback);
};

const handleNewContent = debounce(() => {
    // Your logic to handle new content goes here
    const questionsThreads = document.querySelectorAll('[data-tracking-screen="Web2app_Chat_function"]');
    questionsThreads.forEach(question => {
        // Check if the event listener is already attached
        if (!hasEventListener(question, 'click', handleQuestionClick)) {
            question.addEventListener("click", handleQuestionClick);
        }
    });
}, 500); // Adjust the delay as needed

const handleUrlChange = debounce(() => {
    // Reattach content observer after URL change
    contentObserver.disconnect();
    contentObserver.observe(document.body, observerConfig);
    // Handle page change logic here (e.g., reload content)
    handleNewContent();
}, 500); // Adjust the delay as needed

// Observer configurations
const observerConfig = { subtree: true, childList: true };

// Observer for new content
const contentObserver = new MutationObserver(handleNewContent);

// Observer for URL changes
const urlObserver = new MutationObserver(handleUrlChange);

// Function to set up observers
const setupObservers = () => {
    urlObserver.observe(document, observerConfig);
    contentObserver.observe(document.body, observerConfig);
};

// Initial setup
setupObservers();
