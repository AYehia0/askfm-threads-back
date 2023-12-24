import browser from "webextension-polyfill";
import {
    getThreadDetails,
    addToThread,
    ThreadDetails,
    deleteFromThread
} from "./askfm/api.ts";

const MSG_MAX_LENGTH = 300;
const PLACEHOLDER_AVATAR =
    "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";

const extractQuestionIdFromHref = (href: string | null) => {
    if (!href) return null;
    const match = href.match(/\/answers\/(\d+)/);
    return match ? match[1] : null;
};

// check if the user who's adding to the thread is the owner (the thread is in their profile)
const isUserOwner = (
    answerOwner: string | undefined,
    loggedInUser: string
): boolean => {
    return answerOwner === loggedInUser;
};

// a function to return the background-color based on the user
const getBackgroundColor = (
    answerOwner: string,
    loggedInUser: string,
    isOwn: boolean
): string => {
    let backgroundColor = "#f0f0f0";
    if (isUserOwner(answerOwner, loggedInUser) && isOwn)
        backgroundColor = "#ed828259";
    else if (!isUserOwner(answerOwner, loggedInUser)) {
        if (isOwn) backgroundColor = "#5268e159";
    }

    return backgroundColor;
};
const buildChatHtml = (
    chatDiv: HTMLDivElement,
    chat: ThreadDetails,
    answerOwner: string
) => {
    const ownerBackground = "#ed828259";
    const otherBackground = "#f0f0f0";

    const isOwner = isUserOwner(answerOwner, chat.loggedInUser);

    // add the first message
    chatDiv.innerHTML = `
    <div class="chat-messages" qid="${chat.threadId}" style="
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

      <textarea id="toSendText" maxlength="${MSG_MAX_LENGTH}" type="text" placeholder="Type your message..." style="
        flex: 1;
        padding: 8px;
        margin-right: 10px;
        height: 50px;
        border: 1px solid #ddd;
        border-radius: 5px;"></textarea>

      <label class="switch" style="margin-right: 10px; transform: scale(0.6);">
        <input type="checkbox" id="anonToggle" ${isOwner ? "disabled" : ""}>
        <span class="slider round" style="transform: scale(1.5);"></span>
      </label>

      <button id="sendMessage" style="
        padding: 8px;
        background-color: #ee1144;
        color: #fff;
        border: none;
        height: max-content;
        cursor: pointer;">Send</button>
    </div>

  <!-- <!-- Add a span element for the character counter -->
  <!-- <span id="charCounter" style="margin-left: 340px; margin-top: -30px; position: absolute; color: #333;">0/${MSG_MAX_LENGTH}</span> -->
  `;
    const style = document.createElement("style");
    style.innerHTML = `
  .switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    border-radius: 34px;
    transition: background-color 0.3s;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s;
  }

  input:checked + .slider {
    background-color: #ee1144;
  }

  input:checked + .slider:before {
    transform: translateX(26px);
  }

  .slider.round {
    border-radius: 34px;
  }
`;

    document.head.appendChild(style);

    const messagesContainer = chatDiv.querySelector(".messages-container");

    // add the first msg
    if (messagesContainer) {
        const isOwnClass = "own-message";
        const avatarSrc = chat.owner.avatarUrl;
        const authorName = chat.owner.fullName;

        messagesContainer.innerHTML += `
      <div class="message ${isOwnClass}" style="
        display: flex;
        flex-direction: column;
        margin-bottom: 10px;
        background-color: ${ownerBackground};
        border-radius: 10px;
        padding: 10px;">

        ${
            authorName !== "Anonymous"
                ? `
          <a href="https://ask.fm/${chat.owner.owner}" style="display: flex; align-items: center;" target="_blank">
            <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
              width: 30px;
              height: 30px;
              border-radius: 50%;
              margin-right: 10px;">
            ${authorName}
          </a>
        `
                : `
          <div style="display: flex; align-items: center;">
            <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
              width: 30px;
              height: 30px;
              border-radius: 50%;
              margin-right: 10px;">
            ${authorName}
          </div>
        `
        }
        
        <div class="message-text" style="flex: 1; overflow-wrap: break-word;">
          ${chat.answer.body}
          <div class="small-date" style="font-size: 10px; color: #666; text-align: right;">
            ${new Date(chat.root.createdAt * 1000).toLocaleString()}
          </div>
        </div>
      </div>
    `;
    }

    chat.messages.forEach(msg => {
        if (messagesContainer) {
            const isOwnClass = msg.isOwn ? "own-message" : "other-message";
            const avatarSrc = msg.avatarUrl || PLACEHOLDER_AVATAR;
            const authorName = msg.fullName || "Anonymous";

            messagesContainer.innerHTML += `
        <div class="message ${isOwnClass}"  mid="${msg.id}" style="
          display: flex;
          flex-direction: column;
          margin-bottom: 10px;
          background-color: ${getBackgroundColor(
              answerOwner,
              chat.loggedInUser,
              msg.isOwn
          )};
          border-radius: 10px;
          padding: 10px;">

          ${
              authorName !== "Anonymous"
                  ? `
            <a href="https://ask.fm/${msg.accountId}" style="display: flex; align-items: center;" target="_blank">
              <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
                width: 30px;
                height: 30px;
                border-radius: 50%;
                margin-right: 10px;">
              ${authorName}
            </a>
          `
                  : `
            <div style="display: flex; align-items: center;">
              <img src="${avatarSrc}" alt="Avatar" class="avatar" style="
                width: 30px;
                height: 30px;
                border-radius: 50%;
                margin-right: 10px;">
              ${authorName}
            </div>
          `
          }
          <div class="message-text" style="flex: 1; overflow-wrap: break-word;">
            ${msg.text}
            ${
                isUserOwner(answerOwner, chat.loggedInUser) || msg.isOwn
                    ? `
                    <div class="delete-icon" style="display:flex; justify-content: end; cursor: pointer;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 128 128" style="fill: #f00;">
                        <path d="M49 1C47.34 1 46 2.34 46 4C46 5.66 47.34 7 49 7L79 7C80.66 7 82 5.66 82 4C82 2.34 80.66 1 79 1L49 1z M24 15C16.83 15 11 20.83 11 28C11 35.17 16.83 41 24 41L101 41L101 104C101 113.37 93.37 121 84 121L44 121C34.63 121 27 113.37 27 104L27 52C27 50.34 25.66 49 24 49C22.34 49 21 50.34 21 52L21 104C21 116.68 31.32 127 44 127L84 127C96.68 127 107 116.68 107 104L107 40.640625C112.72 39.280625 117 34.14 117 28C117 20.83 111.17 15 104 15L24 15z M24 21L104 21C107.86 21 111 24.14 111 28C111 31.86 107.86 35 104 35L24 35C20.14 35 17 31.86 17 28C17 24.14 20.14 21 24 21z M50 55C48.34 55 47 56.34 47 58L47 104C47 105.66 48.34 107 50 107C51.66 107 53 105.66 53 104L53 58C53 56.34 51.66 55 50 55z M78 55C76.34 55 75 56.34 75 58L75 104C75 105.66 76.34 107 78 107C79.66 107 81 105.66 81 104L81 58C81 56.34 79.66 55 78 55z"></path>
                      </svg>
                    </div>`
                    : ""
            }
            <div class="small-date" style="font-size: 10px; color: #666; text-align: right;">
              ${new Date(msg.createdAt * 1000).toLocaleString()}
            </div>
          </div>

        </div>
      `;
        }
    });
};

const showChat = (
    questionHTML: Element | null,
    chat: ThreadDetails,
    answerOwner: string
) => {
    // change the +1 messages to Reload
    if (questionHTML) {
        const readAllMessages = questionHTML?.querySelector(
            '[data-tracking-screen="Web2app_Chat_function"]'
        );
        if (readAllMessages) {
            readAllMessages.textContent = "Reload";

            readAllMessages.previousElementSibling?.remove();

            // append the new html
            const chatDiv = document.createElement("div");

            console.log(chat);
            buildChatHtml(chatDiv, chat, answerOwner);

            // append the first chat message
            readAllMessages.previousElementSibling?.after(chatDiv);

            // add event listener to the send button
            const sendMessageButton = chatDiv.querySelector("#sendMessage");
            if (sendMessageButton) {
                addSendMessageClickListener(
                    sendMessageButton as HTMLElement,
                    chatDiv
                );
            }

            // add eventListener on the delete-icon
            const deleteIcons = chatDiv.querySelectorAll(".delete-icon");
            if (deleteIcons) {
                addDeleteMessageClickListener(deleteIcons);
            }
        }
    }
};

const addDeleteMessageClickListener = (deleteIcons: NodeListOf<Element>) => {
    deleteIcons.forEach(el => {
        el.addEventListener("click", _ => {
            // get the message clicked first
            const message = el.closest(".message");
            const messageId = message?.getAttribute("mid");

            if (messageId) {
                deleteFromThread(messageId);
            }
        });
    });
};

// Event handler for send message button click
const handleSendMessageClick = (
    _: MouseEvent,
    chatDiv: HTMLDivElement
): void => {
    // Get the associated input element from the chatDiv
    const inputText = chatDiv?.querySelector("textarea");

    if (inputText) {
        // get the questionId
        const chatMessagesDiv = chatDiv.querySelector(".chat-messages");
        const questionId = chatMessagesDiv?.getAttribute("qid");

        const anonSwitch = chatDiv.querySelector(
            "#anonToggle"
        ) as HTMLInputElement;

        // add to thread
        if (questionId) {
            console.log(inputText.innerText);
            addToThread(questionId, inputText.value, anonSwitch.checked);
        }

        // Clear the input text
        inputText.value = "";
    }
};

const addSendMessageClickListener = (
    sendMessageButton: HTMLElement,
    chatDiv: HTMLDivElement
): void => {
    sendMessageButton.addEventListener("click", event => {
        handleSendMessageClick(event, chatDiv);
    });
};

const getAnswerOwner = (url: string): string => {
    const regex = /ask\.fm\/([^/]+)/;
    const matches = url?.match(regex);
    if (matches) {
        return matches[1];
    }
    return "";
};

const handleQuestionClick = async (
    event: Event,
    questionsNums: string | undefined
) => {
    // get the question id from that element : under that class streamItem_meta
    const article = (event.currentTarget as HTMLElement).closest(
        ".item.streamItem-answer"
    );
    if (article) {
        const questionLink = article.querySelector("a.streamItem_meta");
        const href = questionLink!.getAttribute("href");

        let answerOwner = "";
        // get the user in card
        if (href) answerOwner = getAnswerOwner(href);

        const questionId = extractQuestionIdFromHref(href);
        if (questionId) {
            if (!questionsNums) {
                questionsNums = "1";
            }
            const chat = await getThreadDetails(questionId!, questionsNums);
            showChat(article, chat, answerOwner);
        }
    }
};

// Function to add event listener to questions
function addEventListenerToQuestion(question: Element) {
    if (!question.hasAttribute("data-listener-attached")) {
        let questionNums = question.textContent?.match(/\d+/)?.[0];

        question.addEventListener("click", event =>
            handleQuestionClick(event, questionNums)
        );
        // Add a flag to indicate that the listener is attached
        question.setAttribute("data-listener-attached", "true");
    }
}

// Function to initialize event listeners
function initializeEventListeners() {
    let config = { childList: true, subtree: true };
    let callback = function(mutationsList: any) {
        for (let mutation of mutationsList) {
            if (mutation.type == "childList") {
                const newQuestions = document.querySelectorAll(
                    '[data-tracking-screen="Web2app_Chat_function"]'
                );
                newQuestions.forEach(question => {
                    addEventListenerToQuestion(question);
                });
            }
        }
    };

    let observer = new MutationObserver(callback);
    observer.observe(document.body, config);
}

document.addEventListener("DOMNodeInserted", () => {
    initializeEventListeners();
});
