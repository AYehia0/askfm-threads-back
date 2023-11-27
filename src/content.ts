import {getThreadsDetails} from "./askfm/api.ts"

const extractQuestionIdFromHref = (href: string | null) => {
    if (!href) return null;
    const match = href.match(/\/answers\/(\d+)/);
    return match ? match[1] : null;
};

const handleQuestionClick = async (event: Event) => {
    // get the question id from that element : under that class streamItem_meta
    const article = (event.currentTarget as HTMLElement).closest('.item.streamItem-answer');
    if (article) {
        const questionLink = article.querySelector('.streamItem_meta');
        const href = questionLink!.getAttribute('href');
        const questionId = extractQuestionIdFromHref(href);

        console.log("Trying to get chats for : ", questionId)

        const chat = await getThreadsDetails(questionId!)
        console.log(chat)
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
    console.log(`URL changed to ${location.href}`);
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
