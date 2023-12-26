type Answer = {
    type: string;
    body: string;
    createdAt: number;
    photoThumbUrl?: string;
};

type RootAnswer = {
    avatarThumbUrl?: string;
    author?: string;
    authorName?: string;
    createdAt: number;
};

type Owner = {
    owner: string;
    avatarUrl: string;
    fullName: string;
};

export type Message = {
    id: number;
    fullName?: string;
    accountId?: string;
    avatarUrl?: string;
    createdAt: number;
    text: string;
    isOwn: boolean;
};

export type ThreadDetails = {
    loggedInUser: string;
    threadId: string;
    owner: Owner;
    root: RootAnswer;
    answer: Answer;
    messages: Message[];
};
