import {getThreadsDetails, ThreadDetails} from "./askfm/api.ts"


const PLACEHOLDER_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"

const extractQuestionIdFromHref = (href: string | null) => {
    if (!href) return null;
    const match = href.match(/\/answers\/(\d+)/);
    return match ? match[1] : null;
};

const buildChatHtml = (chatDiv: HTMLDivElement, chat: ThreadDetails) => {

    const ownerBackground = '#ed828259'
    const otherBackground = '#f0f0f0'

    // Sort messages by createdAt
    const sortedMessages = [...chat.messages].sort((a, b) => a.createdAt - b.createdAt);

  // add the first message
  chatDiv.innerHTML = `
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
      justify-content: space-between;">

      <input v-model="newMessage" type="text" placeholder="Type your message..." style="
        flex: 1;
        padding: 8px;
        margin-right: 10px;
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
    const isOwnClass =  "own-message";
    const avatarSrc = chat.owner.avatarUrl
    const authorName = chat.owner.fullName

    messagesContainer.innerHTML += `
      <div class="message ${isOwnClass}" style="
        display: flex;
        flex-direction: column;
        margin-bottom: 10px;
        background-color: ${ownerBackground};
        border-radius: 10px;
        padding: 10px;">

        ${authorName !== "Anonymous" ? `
          <a href="https://ask.fm/${chat.owner.owner}" style="display: flex; align-items: center;" target="_blank">
            <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
              width: 30px;
              height: 30px;
              border-radius: 50%;
              margin-right: 10px;">
            ${authorName}
          </a>
        ` : `
          <div style="display: flex; align-items: center;">
            <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
              width: 30px;
              height: 30px;
              border-radius: 50%;
              margin-right: 10px;">
            ${authorName}
          </div>
        `}
        
        <div class="message-text" style="flex: 1;">
          ${chat.answer.body}
          <div class="small-date" style="font-size: 10px; color: #666; text-align: right;">
            ${new Date(chat.root.createdAt * 1000).toLocaleString()}
          </div>
        </div>
      </div>
    `;
  }

  sortedMessages.forEach((msg) => {
    if (messagesContainer) {
      const isOwnClass = msg.isOwn ? "own-message" : "other-message";
      const avatarSrc = msg.avatarUrl || PLACEHOLDER_AVATAR;
      const authorName = msg.fullName || "Anonymous";

      messagesContainer.innerHTML += `
        <div class="message ${isOwnClass}" style="
          display: flex;
          flex-direction: column;
          margin-bottom: 10px;
          background-color: ${msg.isOwn ? ownerBackground : otherBackground};
          border-radius: 10px;
          padding: 10px;">

          ${authorName !== "Anonymous" ? `
            <a href="https://ask.fm/${msg.accountId}" style="display: flex; align-items: center;" target="_blank">
              <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
                width: 30px;
                height: 30px;
                border-radius: 50%;
                margin-right: 10px;">
              ${authorName}
            </a>
          ` : `
            <div style="display: flex; align-items: center;">
              <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
                width: 30px;
                height: 30px;
                border-radius: 50%;
                margin-right: 10px;">
              ${authorName}
            </div>
          `}
          
          <div class="message-text" style="flex: 1;">
            ${msg.text}
            <div class="small-date" style="font-size: 10px; color: #666; text-align: right;">
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
