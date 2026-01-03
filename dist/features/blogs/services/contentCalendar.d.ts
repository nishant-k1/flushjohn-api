/**
 * Content Calendar Service
 * Manages rotating blog topics and seasonal scheduling for automated content generation
 */
export declare const contentCalendar: {
    citySpecific: {
        title: string;
        category: string;
        city: string;
        state: string;
        keywords: string[];
        templateType: string;
        season: string;
    }[];
    industryGuides: {
        title: string;
        category: string;
        keywords: string[];
        templateType: string;
        season: string;
        focus: string;
    }[];
    seasonal: {
        title: string;
        category: string;
        keywords: string[];
        templateType: string;
        season: string;
        focus: string;
    }[];
    caseStudies: {
        title: string;
        category: string;
        keywords: {
            primary: string;
            secondary: string;
            longTail: string;
        };
        templateType: string;
        season: string;
        focus: string;
    }[];
};
export declare function getCurrentSeason(): "summer" | "spring" | "fall" | "winter";
export declare function getNextTopic(contentType?: any, randomize?: boolean): any;
export declare function getTopicsForSeason(season: any): ({
    title: string;
    category: string;
    city: string;
    state: string;
    keywords: string[];
    templateType: string;
    season: string;
} | {
    title: string;
    category: string;
    keywords: string[];
    templateType: string;
    season: string;
    focus: string;
} | {
    title: string;
    category: string;
    keywords: {
        primary: string;
        secondary: string;
        longTail: string;
    };
    templateType: string;
    season: string;
    focus: string;
})[];
export declare function getCalendarStats(): {
    totalTopics: number;
    citySpecific: number;
    industryGuides: number;
    seasonal: number;
    caseStudies: number;
    currentSeason: string;
    nextTopic: any;
};
//# sourceMappingURL=contentCalendar.d.ts.map