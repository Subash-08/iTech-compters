export interface SocialProofSection {
    _id: string;
    isActive: boolean;
    backgroundColor: string;
    backgroundImage: {
        url: string;
        altText: string;
    };
    heading: string;
    illustrationImage: {
        url: string;
        altText: string;
    };
    google: {
        rating: number;
        label: string;
    };
    instagram: {
        followers: string;
        label: string;
    };
    youtube: {
        subscribers: string;
        label: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface SocialProofFormData {
    isActive: boolean;
    backgroundColor: string;
    backgroundImage: File | null;
    heading: string;
    illustrationImage: File | null;
    googleRating: number;
    googleLabel: string;
    instagramFollowers: string;
    instagramLabel: string;
    youtubeSubscribers: string;
    youtubeLabel: string;
}
