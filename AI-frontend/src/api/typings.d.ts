declare namespace API {
  type addPostTagParams = {
    postId: number
    tagId: number
  }

  type addVoiceParams = {
    name: string
    promptText?: string
    promptLang?: string
    textLang?: string
  }

  type AppAddRequest = {
    appName?: string
    cover?: string
    initPrompt?: string
    codeGenType?: string
    priority?: number
  }

  type AppDeployRequest = {
    appId?: number
  }

  type AppQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    appName?: string
    codeGenType?: string
    userId?: number
    isFeatured?: boolean
  }

  type AppUpdateRequest = {
    id?: number
    appName?: string
    cover?: string
    priority?: number
  }

  type AppVO = {
    id?: number
    appName?: string
    cover?: string
    initPrompt?: string
    codeGenType?: string
    deployKey?: string
    deployedTime?: string
    priority?: number
    userId?: number
    user?: UserVO
    editTime?: string
    createTime?: string
    updateTime?: string
  }

  type BaseResponseAppVO = {
    code?: number
    data?: AppVO
    message?: string
  }

  type BaseResponseBlogCategoryVO = {
    code?: number
    data?: BlogCategoryVO
    message?: string
  }

  type BaseResponseBlogImageVO = {
    code?: number
    data?: BlogImageVO
    message?: string
  }

  type BaseResponseBlogPostVO = {
    code?: number
    data?: BlogPostVO
    message?: string
  }

  type BaseResponseBlogTagVO = {
    code?: number
    data?: BlogTagVO
    message?: string
  }

  type BaseResponseBoolean = {
    code?: number
    data?: boolean
    message?: string
  }

  type BaseResponseChatAgentConfigVO = {
    code?: number
    data?: ChatAgentConfigVO
    message?: string
  }

  type BaseResponseChatAttachmentVO = {
    code?: number
    data?: ChatAttachmentVO
    message?: string
  }

  type BaseResponseChatConversationVO = {
    code?: number
    data?: ChatConversationVO
    message?: string
  }

  type BaseResponseDiaryEntryPrevNextVO = {
    code?: number
    data?: DiaryEntryPrevNextVO
    message?: string
  }

  type BaseResponseDiaryEntryVO = {
    code?: number
    data?: DiaryEntryVO
    message?: string
  }

  type BaseResponseImageUploadResponse = {
    code?: number
    data?: ImageUploadResponse
    message?: string
  }

  type BaseResponseListBlogCategory = {
    code?: number
    data?: BlogCategory[]
    message?: string
  }

  type BaseResponseListBlogImage = {
    code?: number
    data?: BlogImage[]
    message?: string
  }

  type BaseResponseListBlogTag = {
    code?: number
    data?: BlogTag[]
    message?: string
  }

  type BaseResponseListBlogTagVO = {
    code?: number
    data?: BlogTagVO[]
    message?: string
  }

  type BaseResponseListChatConfigVO = {
    code?: number
    data?: ChatConfigVO[]
    message?: string
  }

  type BaseResponseListChatConversationVO = {
    code?: number
    data?: ChatConversationVO[]
    message?: string
  }

  type BaseResponseListChatHistoryVO = {
    code?: number
    data?: ChatHistoryVO[]
    message?: string
  }

  type BaseResponseListDiaryEntryMonthItemVO = {
    code?: number
    data?: DiaryEntryMonthItemVO[]
    message?: string
  }

  type BaseResponseListLong = {
    code?: number
    data?: number[]
    message?: string
  }

  type BaseResponseListString = {
    code?: number
    data?: string[]
    message?: string
  }

  type BaseResponseListStudyHabitVO = {
    code?: number
    data?: StudyHabitVO[]
    message?: string
  }

  type BaseResponseListStudyListVO = {
    code?: number
    data?: StudyListVO[]
    message?: string
  }

  type BaseResponseListStudyTaskChecklistVO = {
    code?: number
    data?: StudyTaskChecklistVO[]
    message?: string
  }

  type BaseResponseListTtsVoiceVO = {
    code?: number
    data?: TtsVoiceVO[]
    message?: string
  }

  type BaseResponseLoginUserVO = {
    code?: number
    data?: LoginUserVO
    message?: string
  }

  type BaseResponseLong = {
    code?: number
    data?: number
    message?: string
  }

  type BaseResponsePageAppVO = {
    code?: number
    data?: PageAppVO
    message?: string
  }

  type BaseResponsePageBlogCategoryVO = {
    code?: number
    data?: PageBlogCategoryVO
    message?: string
  }

  type BaseResponsePageBlogImageVO = {
    code?: number
    data?: PageBlogImageVO
    message?: string
  }

  type BaseResponsePageBlogPostVO = {
    code?: number
    data?: PageBlogPostVO
    message?: string
  }

  type BaseResponsePageBlogTagVO = {
    code?: number
    data?: PageBlogTagVO
    message?: string
  }

  type BaseResponsePageChatHistory = {
    code?: number
    data?: PageChatHistory
    message?: string
  }

  type BaseResponsePageChatHistoryVO = {
    code?: number
    data?: PageChatHistoryVO
    message?: string
  }

  type BaseResponsePageChatMessageVO = {
    code?: number
    data?: PageChatMessageVO
    message?: string
  }

  type BaseResponsePageDiaryEntryVO = {
    code?: number
    data?: PageDiaryEntryVO
    message?: string
  }

  type BaseResponsePageStudyFocusSessionVO = {
    code?: number
    data?: PageStudyFocusSessionVO
    message?: string
  }

  type BaseResponsePageStudyTaskVO = {
    code?: number
    data?: PageStudyTaskVO
    message?: string
  }

  type BaseResponsePageUserVO = {
    code?: number
    data?: PageUserVO
    message?: string
  }

  type BaseResponseString = {
    code?: number
    data?: string
    message?: string
  }

  type BaseResponseStringArray = {
    code?: number
    data?: string[]
    message?: string
  }

  type BaseResponseStudyBlogSyncVO = {
    code?: number
    data?: StudyBlogSyncVO
    message?: string
  }

  type BaseResponseStudyFocusSessionVO = {
    code?: number
    data?: StudyFocusSessionVO
    message?: string
  }

  type BaseResponseStudyRangeStatsVO = {
    code?: number
    data?: StudyRangeStatsVO
    message?: string
  }

  type BaseResponseStudyTaskVO = {
    code?: number
    data?: StudyTaskVO
    message?: string
  }

  type BaseResponseStudyTodayStatsVO = {
    code?: number
    data?: StudyTodayStatsVO
    message?: string
  }

  type BaseResponseStudyWorkspaceVO = {
    code?: number
    data?: StudyWorkspaceVO
    message?: string
  }

  type BaseResponseTtsConfigVO = {
    code?: number
    data?: TtsConfigVO
    message?: string
  }

  type BaseResponseTtsHealthVO = {
    code?: number
    data?: TtsHealthVO
    message?: string
  }

  type BaseResponseTtsVoiceVO = {
    code?: number
    data?: TtsVoiceVO
    message?: string
  }

  type BaseResponseUser = {
    code?: number
    data?: User
    message?: string
  }

  type BaseResponseUserVO = {
    code?: number
    data?: UserVO
    message?: string
  }

  type bindImageToPostParams = {
    imageId: number
    postId?: number
  }

  type BlogCategory = {
    id?: number
    name?: string
    description?: string
    icon?: string
    sortOrder?: number
    status?: number
    createdTime?: string
    updatedTime?: string
  }

  type BlogCategoryAddRequest = {
    name?: string
    description?: string
    icon?: string
    sortOrder?: number
    status?: number
  }

  type BlogCategoryQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    name?: string
    status?: number
    searchText?: string
  }

  type BlogCategoryUpdateRequest = {
    id?: number
    name?: string
    description?: string
    icon?: string
    sortOrder?: number
    status?: number
  }

  type BlogCategoryVO = {
    id?: number
    name?: string
    description?: string
    icon?: string
    sortOrder?: number
    status?: number
    statusText?: string
    postCount?: number
    createdTime?: string
    updatedTime?: string
  }

  type BlogImage = {
    id?: number
    filename?: string
    storageName?: string
    url?: string
    size?: number
    type?: string
    width?: number
    height?: number
    postId?: number
    userId?: number
    usageType?: number
    status?: number
    createdTime?: string
  }

  type BlogImageQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    postId?: number
    userId?: number
    usageType?: number
    status?: number
    searchText?: string
  }

  type BlogImageVO = {
    id?: number
    filename?: string
    storageName?: string
    url?: string
    size?: number
    type?: string
    width?: number
    height?: number
    postId?: number
    userId?: number
    userName?: string
    usageType?: number
    usageTypeText?: string
    status?: number
    statusText?: string
    createdTime?: string
  }

  type BlogPostAddRequest = {
    title?: string
    summary?: string
    content?: string
    coverUrl?: string
    categoryId?: number
    tagIds?: number[]
    status?: number
    isTop?: number
    sortOrder?: number
    extendInfo?: string
  }

  type BlogPostQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    title?: string
    summary?: string
    categoryId?: number
    userId?: number
    status?: number
    isTop?: number
    tagId?: number
    searchText?: string
  }

  type BlogPostUpdateRequest = {
    id?: number
    title?: string
    summary?: string
    content?: string
    coverUrl?: string
    categoryId?: number
    tagIds?: number[]
    viewCount?: number
    likeCount?: number
    status?: number
    isTop?: number
    sortOrder?: number
    extendInfo?: string
  }

  type BlogPostVO = {
    id?: number
    title?: string
    summary?: string
    content?: string
    coverUrl?: string
    categoryId?: number
    categoryName?: string
    userId?: number
    userName?: string
    userAvatar?: string
    viewCount?: number
    likeCount?: number
    status?: number
    statusText?: string
    isTop?: number
    sortOrder?: number
    extendInfo?: string
    tags?: BlogTagVO[]
    createdTime?: string
    updatedTime?: string
  }

  type BlogTag = {
    id?: number
    name?: string
    description?: string
    color?: string
    count?: number
    status?: number
    createdTime?: string
    updatedTime?: string
  }

  type BlogTagAddRequest = {
    name?: string
    description?: string
    color?: string
    status?: number
  }

  type BlogTagQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    name?: string
    status?: number
    searchText?: string
  }

  type BlogTagUpdateRequest = {
    id?: number
    name?: string
    description?: string
    color?: string
    count?: number
    status?: number
  }

  type BlogTagVO = {
    id?: number
    name?: string
    description?: string
    color?: string
    count?: number
    status?: number
    statusText?: string
    createdTime?: string
    updatedTime?: string
  }

  type ChatAgentConfigVO = {
    defaultMode?: string
    agentEnabled?: boolean
    agentHint?: string
    modules?: string[]
    toolNames?: string[]
  }

  type ChatAttachmentVO = {
    attachmentId?: string
    type?: string
    filename?: string
  }

  type ChatConfigVO = {
    id?: string
    name?: string
    description?: string
    raw?: Record<string, any>
  }

  type ChatConversationCreateRequest = {
    configId?: string
    title?: string
  }

  type ChatConversationResolveRequest = {
    configId?: string
  }

  type ChatConversationVO = {
    id?: number
    configId?: string
    configName?: string
    title?: string
    isDefault?: boolean
    lastMessageAt?: string
    createTime?: string
    messageCount?: number
  }

  type ChatHistory = {
    id?: number
    message?: string
    messageType?: string
    appId?: number
    userId?: number
    createTime?: string
    updateTime?: string
    isDelete?: number
    parentId?: number
  }

  type ChatHistoryQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    message?: string
    messageType?: string
    appId?: number
    userId?: number
    lastCreateTime?: string
  }

  type ChatHistoryVO = {
    id?: number
    message?: string
    messageType?: string
    appId?: number
    userId?: number
    createTime?: string
    parentId?: number
  }

  type ChatMessageSegment = {
    type?: string
    text?: string
    attachmentId?: string
  }

  type ChatMessageVO = {
    id?: number
    conversationId?: number
    messageType?: string
    content?: string
    source?: string
    parentId?: number
    createTime?: string
  }

  type ChatRequest = {
    conversationId?: number
    configId?: string
    message?: string
    segments?: ChatMessageSegment[]
    mode?: string
    confirmToken?: string
  }

  type chatToGenCodeParams = {
    appId: number
    message: string
  }

  type DailyBreakdown = {
    date?: string
    completedTasks?: number
    focusMinutes?: number
  }

  type deleteByAppIdParams = {
    appId: number
  }

  type deleteConversationParams = {
    id: number
  }

  type deleteImage1Params = {
    filename: string
  }

  type DeleteRequest = {
    id?: number
  }

  type DiaryEntryMonthItemVO = {
    id?: number
    diaryDate?: string
    title?: string
    mood?: string
    status?: number
  }

  type DiaryEntryPrevNextVO = {
    prevId?: number
    prevDate?: string
    prevTitle?: string
    nextId?: number
    nextDate?: string
    nextTitle?: string
  }

  type DiaryEntryQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    startDate?: string
    endDate?: string
    status?: number
  }

  type DiaryEntrySaveRequest = {
    diaryDate?: string
    title?: string
    content?: string
    mood?: string
    weather?: string
    tags?: string[]
    status?: number
    coverUrl?: string
  }

  type DiaryEntryVO = {
    id?: number
    userId?: number
    diaryDate?: string
    title?: string
    content?: string
    mood?: string
    weather?: string
    tags?: string[]
    status?: number
    statusText?: string
    wordCount?: number
    coverUrl?: string
    extendInfo?: string
    createdTime?: string
    updatedTime?: string
  }

  type existsPostTagParams = {
    postId: number
    tagId: number
  }

  type getAppByIdByAdminParams = {
    id: number
  }

  type getAppByIdParams = {
    id: number
  }

  type getBlogPostPageByCategoryParams = {
    categoryId: number
    pageNum?: number
    pageSize?: number
  }

  type getBlogPostPageByTagParams = {
    tagId: number
    pageNum?: number
    pageSize?: number
  }

  type getBlogPostVOParams = {
    id: number
  }

  type getCategoryVOParams = {
    id: number
  }

  type getCheckCalendarParams = {
    habitId: number
    year: number
    month: number
  }

  type getConversationParams = {
    id: number
  }

  type getDiaryByDateParams = {
    date: string
  }

  type getDiaryEntryVOParams = {
    id: number
  }

  type getDiaryPrevNextParams = {
    id: number
  }

  type getImagesByPostIdParams = {
    postId: number
  }

  type getImageVOParams = {
    id: number
  }

  type getInfoParams = {
    id: number
  }

  type getLatestChatHistoryParams = {
    appId: number
    limit?: number
  }

  type getPostIdsByTagIdParams = {
    tagId: number
  }

  type getPublishedBlogPostPageParams = {
    pageNum?: number
    pageSize?: number
  }

  type getRangeStatsParams = {
    startDate: string
    endDate: string
  }

  type getTagIdsByPostIdParams = {
    postId: number
  }

  type getTagVOParams = {
    id: number
  }

  type getTaskVOParams = {
    id: number
  }

  type getUserByIdParams = {
    id: number
  }

  type getUserVOByIdParams = {
    id: number
  }

  type getVoiceParams = {
    id: number
  }

  type ImageUploadData = {
    url?: string
    filename?: string
  }

  type ImageUploadResponse = {
    code?: number
    message?: string
    data?: ImageUploadData
  }

  type incrementLikeCountParams = {
    id: number
  }

  type incrementViewCountParams = {
    id: number
  }

  type initRefParams = {
    voiceId?: number
  }

  type initWorkspaceParams = {
    createThemeLists?: boolean
  }

  type listAppChatHistoryParams = {
    appId: number
    pageSize?: number
    lastCreateTime?: string
  }

  type listChatHistoryByPageForAdminParams = {
    chatHistoryQueryRequest: ChatHistoryQueryRequest
  }

  type listChatHistoryByPageParams = {
    chatHistoryQueryRequest: ChatHistoryQueryRequest
    appId: number
  }

  type listChecklistParams = {
    taskId: number
  }

  type listConversationsParams = {
    configId?: string
  }

  type listDiaryByMonthParams = {
    year: number
    month: number
  }

  type listFocusPageParams = {
    pageNum?: number
    pageSize?: number
    startDate?: string
    endDate?: string
  }

  type listMessagesParams = {
    id: number
    pageNum?: number
    pageSize?: number
  }

  type LoginUserVO = {
    id?: number
    userAccount?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    createTime?: string
    updateTime?: string
  }

  type PageAppVO = {
    records?: AppVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageBlogCategoryVO = {
    records?: BlogCategoryVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageBlogImageVO = {
    records?: BlogImageVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageBlogPostVO = {
    records?: BlogPostVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageBlogTagVO = {
    records?: BlogTagVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageChatHistory = {
    records?: ChatHistory[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageChatHistoryVO = {
    records?: ChatHistoryVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageChatMessageVO = {
    records?: ChatMessageVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageDiaryEntryVO = {
    records?: DiaryEntryVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type pageParams = {
    page: PageUser
  }

  type PageStudyFocusSessionVO = {
    records?: StudyFocusSessionVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageStudyTaskVO = {
    records?: StudyTaskVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageUser = {
    records?: User[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageUserVO = {
    records?: UserVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type queryTaskViewParams = {
    request: StudyTaskViewQueryRequest
  }

  type removeParams = {
    id: number
  }

  type removePostTagParams = {
    postId: number
    tagId: number
  }

  type saveAiMessageParams = {
    appId: number
    message: string
    parentId: number
  }

  type saveErrorMessageParams = {
    appId: number
    message: string
    parentId: number
  }

  type saveUserMessageParams = {
    appId: number
    message: string
  }

  type ServerSentEventString = true

  type SortItem = {
    id?: number
    sortOrder?: number
  }

  type StudyBlogSyncVO = {
    syncedCount?: number
    taskIds?: number[]
  }

  type StudyChecklistAddRequest = {
    taskId?: number
    title?: string
    sortOrder?: number
  }

  type StudyChecklistUpdateRequest = {
    id?: number
    title?: string
    done?: number
    sortOrder?: number
  }

  type StudyFocusIdRequest = {
    id?: number
  }

  type StudyFocusSessionVO = {
    id?: number
    userId?: number
    taskId?: number
    taskTitle?: string
    focusType?: number
    plannedMinutes?: number
    actualSeconds?: number
    status?: number
    startedTime?: string
    endedTime?: string
    pauseTotalSeconds?: number
  }

  type StudyFocusStartRequest = {
    taskId?: number
    focusType?: number
    plannedMinutes?: number
  }

  type StudyHabitAddRequest = {
    title?: string
    description?: string
    icon?: string
    color?: string
    targetDaysPerWeek?: number
  }

  type StudyHabitCheckRequest = {
    habitId?: number
    checkDate?: string
  }

  type StudyHabitUpdateRequest = {
    id?: number
    title?: string
    description?: string
    icon?: string
    color?: string
    targetDaysPerWeek?: number
    sortOrder?: number
    status?: number
  }

  type StudyHabitVO = {
    id?: number
    userId?: number
    title?: string
    description?: string
    icon?: string
    color?: string
    targetDaysPerWeek?: number
    streakCount?: number
    bestStreak?: number
    lastCheckDate?: string
    checkedToday?: boolean
    weekCheckedDays?: number
    sortOrder?: number
    status?: number
  }

  type StudyListAddRequest = {
    name?: string
    color?: string
    icon?: string
    sortOrder?: number
  }

  type StudyListSortRequest = {
    items?: SortItem[]
  }

  type StudyListUpdateRequest = {
    id?: number
    name?: string
    color?: string
    icon?: string
    sortOrder?: number
    status?: number
  }

  type StudyListVO = {
    id?: number
    userId?: number
    name?: string
    color?: string
    icon?: string
    listType?: number
    sortOrder?: number
    taskCount?: number
    status?: number
    createdTime?: string
    updatedTime?: string
  }

  type StudyRangeStatsVO = {
    completedTaskCount?: number
    focusMinutes?: number
    habitCheckCount?: number
    dailyBreakdown?: DailyBreakdown[]
  }

  type StudyTaskAddRequest = {
    title?: string
    listId?: number
    content?: string
    priority?: number
    dueDate?: string
    isToday?: boolean
    sortOrder?: number
    sourceType?: number
    sourceId?: number
  }

  type StudyTaskChecklistVO = {
    id?: number
    taskId?: number
    title?: string
    done?: number
    sortOrder?: number
  }

  type StudyTaskMoveRequest = {
    taskIds?: number[]
    targetListId?: number
  }

  type StudyTaskSortRequest = {
    listId?: number
    items?: SortItem[]
  }

  type StudyTaskToggleRequest = {
    id?: number
    done?: boolean
  }

  type StudyTaskUpdateRequest = {
    id?: number
    title?: string
    listId?: number
    content?: string
    priority?: number
    dueDate?: string
    isToday?: boolean
    sortOrder?: number
  }

  type StudyTaskViewQueryRequest = {
    view?: string
    listId?: number
    hideCompleted?: boolean
    completedDays?: number
    pageNum?: number
    pageSize?: number
  }

  type StudyTaskVO = {
    id?: number
    userId?: number
    listId?: number
    listName?: string
    title?: string
    content?: string
    status?: number
    priority?: number
    dueDate?: string
    isToday?: number
    sortOrder?: number
    sourceType?: number
    sourceId?: number
    completedTime?: string
    checklistItems?: StudyTaskChecklistVO[]
    createdTime?: string
    updatedTime?: string
  }

  type StudyTodayStatsVO = {
    date?: string
    totalTasks?: number
    completedTasks?: number
    overdueTasks?: number
    focusMinutes?: number
    habitsChecked?: number
    habitsTotal?: number
  }

  type StudyWorkspaceVO = {
    inboxListId?: number
    lists?: StudyListVO[]
    todayStats?: StudyTodayStatsVO
    activeFocus?: StudyFocusSessionVO
    /** 工作台是否展示清单（来自站点设置） */
    showChecklist?: boolean
  }

  type toggleTopStatusParams = {
    id: number
    isTop: number
  }

  type TtsConfigVO = {
    enabled?: boolean
    defaultVoiceId?: number
    defaultVoiceName?: string
    gptSovitsAvailable?: boolean
    refPreloaded?: boolean
  }

  type TtsHealthVO = {
    available?: boolean
    message?: string
    baseUrl?: string
  }

  type TtsSynthesizeRequest = {
    text?: string
    voiceId?: number
    textLang?: string
    speedFactor?: number
    textSplitMethod?: string
    streamingMode?: Record<string, any>
    mediaType?: string
  }

  type TtsVoiceSelectRequest = {
    id?: number
  }

  type TtsVoiceUpdateRequest = {
    id?: number
    name?: string
    promptText?: string
    promptLang?: string
    textLang?: string
    status?: number
    sortOrder?: number
  }

  type TtsVoiceVO = {
    id?: number
    name?: string
    refAudioPath?: string
    promptText?: string
    promptLang?: string
    textLang?: string
    isDefault?: number
    status?: number
    sortOrder?: number
  }

  type updateBlogPostStatusParams = {
    id: number
    status: number
  }

  type updateImageStatusParams = {
    id: number
    status: number
  }

  type User = {
    id?: number
    userAccount?: string
    userPassword?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    editTime?: string
    createTime?: string
    updateTime?: string
    isDelete?: number
    vipExpireTime?: string
    vipCode?: string
    vipNumber?: number
    shareCode?: string
    inviteUser?: number
  }

  type UserAddRequest = {
    userName?: string
    userAccount?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
  }

  type UserLoginRequest = {
    userAccount?: string
    userPassword?: string
  }

  type UserQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    userName?: string
    userAccount?: string
    userProfile?: string
    userRole?: string
  }

  type UserRegisterRequest = {
    userAccount?: string
    userPassword?: string
    checkPassword?: string
  }

  type UserUpdateRequest = {
    id?: number
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
  }

  type UserVO = {
    id?: number
    userAccount?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    createTime?: string
  }

  // ---------- Knowledge AI (/kb, /admin/knowledge) ----------
  type KnowledgeParseStatus = 'PENDING' | 'PARSING' | 'SUCCESS' | 'FAILED' | string

  type KnowledgeBaseVO = {
    id?: number | string
    name?: string
    description?: string
    userId?: number | string
    visibility?: string
    status?: number
    documentCount?: number
    createTime?: string
    updateTime?: string
  }

  type KnowledgeBaseCreateRequest = {
    name: string
    description?: string
    visibility?: string
  }

  type KnowledgeBaseUpdateRequest = {
    name?: string
    description?: string
    visibility?: string
    status?: number
  }

  type KnowledgeBaseQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    name?: string
    visibility?: string
    status?: number
  }

  type PageKnowledgeBaseVO = {
    records?: KnowledgeBaseVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
  }

  type KnowledgeDocumentVO = {
    id?: number | string
    knowledgeBaseId?: number | string
    userId?: number | string
    sourceDocumentId?: number | string
    fileName?: string
    fileType?: string
    fileSize?: number
    bucketName?: string
    objectKey?: string
    parseStatus?: KnowledgeParseStatus
    chunkCount?: number
    errorMessage?: string
    parsedAt?: string
    createTime?: string
    updateTime?: string
  }

  type KnowledgeDocumentQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    fileName?: string
    fileType?: string
    parseStatus?: string
  }

  type PageKnowledgeDocumentVO = {
    records?: KnowledgeDocumentVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
  }

  type KnowledgeChunkVO = {
    id?: number | string
    knowledgeBaseId?: number | string
    knowledgeDocumentId?: number | string
    sourceDocumentId?: number | string
    chunkIndex?: number
    heading?: string
    content?: string
    tokenCount?: number
    metadata?: string
    createTime?: string
    score?: number
  }

  type KnowledgeDownloadUrlVO = {
    url?: string
    expireSeconds?: number
  }

  type KnowledgeConversationVO = {
    id?: number | string
    userId?: number | string
    knowledgeBaseId?: number | string
    title?: string
    lastMessage?: string
    createTime?: string
    updateTime?: string
  }

  type KnowledgeReferenceVO = {
    chunkId?: number | string
    knowledgeDocumentId?: number | string
    sourceDocumentId?: number | string
    chunkIndex?: number
    documentName?: string
    content?: string
    similarity?: number
  }

  type KnowledgeMessageVO = {
    id?: number | string
    conversationId?: number | string
    userId?: number | string
    role?: 'USER' | 'ASSISTANT' | 'SYSTEM' | string
    content?: string
    modelName?: string
    createTime?: string
    references?: KnowledgeReferenceVO[]
  }

  type PageKnowledgeMessageVO = {
    records?: KnowledgeMessageVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
  }

  type KnowledgeChatRequest = {
    conversationId?: number | string
    knowledgeBaseId: number | string
    sourceDocumentId?: number | string
    mode?: 'knowledgeBase' | 'document' | string
    question: string
    topK?: number
  }

  type KnowledgeChatResponse = {
    conversationId?: number | string
    userMessageId?: number | string
    assistantMessageId?: number | string
    answer?: string
    references?: KnowledgeReferenceVO[]
  }

  type KnowledgeProcessRequest = {
    inputType?: string
    url: string
    knowledgeBaseId?: number | string
    title?: string
    tags?: string
    generateSummary?: boolean
    enableRag?: boolean
  }

  type KnowledgeSourceDocument = {
    id?: number | string
    title?: string
    userId?: number | string
    knowledgeBaseId?: number | string
    knowledgeDocumentId?: number | string
    sourceType?: string
    sourceUrl?: string
    bucketName?: string
    objectKey?: string
    rawText?: string
    status?: string
    errorMsg?: string
    createTime?: string
    updateTime?: string
  }

  type KnowledgeNote = {
    id?: number | string
    sourceDocumentId?: number | string
    blogPostId?: number | string
    knowledgeDocumentId?: number | string
    title?: string
    distilledMd?: string
    tags?: string
    status?: string
    errorMsg?: string
    publishStatus?: string
    indexStatus?: string
    viewCount?: number
    createTime?: string
    updateTime?: string
    lastDistilledAt?: string
    lastEditedAt?: string
    lastPublishedAt?: string
    lastIndexedAt?: string
  }

  type KnowledgeNoteVO = {
    id?: number | string
    sourceDocumentId?: number | string
    blogPostId?: number | string
    knowledgeDocumentId?: number | string
    title?: string
    tags?: string
    sourceType?: string
    sourceUrl?: string
    status?: string
    publishStatus?: string
    indexStatus?: string
    createTime?: string
    updateTime?: string
    lastEditedAt?: string
    lastPublishedAt?: string
    lastIndexedAt?: string
  }

  type KnowledgeNoteDetailVO = {
    note?: KnowledgeNoteVO
    source?: KnowledgeSourceDocument
    rawTextSummary?: string
    rawText?: string
    distilledMd?: string
    blogPost?: BlogPostVO
    knowledgeDocument?: KnowledgeDocumentVO
  }

  type KnowledgeNoteQueryRequest = {
    pageNum?: number
    pageSize?: number
    keyword?: string
    sourceType?: string
    publishStatus?: string
    indexStatus?: string
  }

  type KnowledgeNoteUpdateRequest = {
    title?: string
    tags?: string
    distilledMd?: string
  }

  type KnowledgeNotePublishRequest = {
    categoryId?: number | string
    tagIds?: (number | string)[]
    /** 0 草稿，1 发布 */
    status?: number
  }

  type KnowledgeNoteIndexRequest = {
    knowledgeBaseId?: number | string
    knowledgeBaseName?: string
    knowledgeBaseDescription?: string
  }

  type KnowledgeIngestUrlRequest = {
    url: string
    title?: string
    tags?: string
    /** URL or AGENT */
    sourceType?: string
    /** AGENT 溯源：学习目标 */
    agentQuery?: string
  }

  type KnowledgeIngestFileRequest = {
    title?: string
    tags?: string
  }

  /** POST /admin/knowledge/ingest/batch-url — 多源合并为 1 篇 note */
  type KnowledgeIngestBatchUrlRequest = {
    urls: string[]
    sourceType?: string
    agentQuery?: string
    /** 本次合蒸覆盖 Prompt；为空时使用 reading.distill.system_prompt */
    distillPrompt?: string
    tags?: string
  }

  type KnowledgeIngestFailedSourceVO = {
    url?: string
    reasonCode?: string | null
    errorMessage?: string | null
  }

  type KnowledgeIngestUsedSourceVO = {
    url?: string
    title?: string | null
    /** 该来源读到的材料字数 */
    bodyChars?: number | null
  }

  type KnowledgeIngestBatchResultVO = {
    success?: boolean
    noteId?: number | string | null
    title?: string | null
    total?: number
    /** 成功参与合并的来源数 */
    usedCount?: number
    failCount?: number
    warning?: string | null
    usedSources?: KnowledgeIngestUsedSourceVO[]
    failedSources?: KnowledgeIngestFailedSourceVO[]
  }

  type KnowledgeSearchPreviewRequest = {
    goal?: string
    preference?: string
  }

  type KnowledgeSearchCandidate = {
    title?: string
    url?: string
    summary?: string
    source?: string
    score?: number
    recommendReason?: string
    /** 如 COURSE_LANDING / PAYWALL_LIKELY / VIDEO_HOST */
    riskFlags?: string[]
  }

  type KnowledgeSearchPreviewVO = {
    goal?: string
    outline?: string
    candidates?: KnowledgeSearchCandidate[]
  }

  type PageKnowledgeNoteVO = {
    records?: KnowledgeNoteVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
  }

  type BaseResponseKnowledgeNoteVO = {
    code?: number
    data?: KnowledgeNoteVO
    message?: string
  }

  type BaseResponsePageKnowledgeNoteVO = {
    code?: number
    data?: PageKnowledgeNoteVO
    message?: string
  }

  type BaseResponseKnowledgeNoteDetailVO = {
    code?: number
    data?: KnowledgeNoteDetailVO
    message?: string
  }

  type BaseResponseKnowledgeSearchPreviewVO = {
    code?: number
    data?: KnowledgeSearchPreviewVO
    message?: string
  }

  type BaseResponseKnowledgeIngestBatchResultVO = {
    code?: number
    data?: KnowledgeIngestBatchResultVO
    message?: string
  }

  type BaseResponseKnowledgeBaseVO = {
    code?: number
    data?: KnowledgeBaseVO
    message?: string
  }

  type BaseResponsePageKnowledgeBaseVO = {
    code?: number
    data?: PageKnowledgeBaseVO
    message?: string
  }

  type BaseResponseKnowledgeDocumentVO = {
    code?: number
    data?: KnowledgeDocumentVO
    message?: string
  }

  type BaseResponsePageKnowledgeDocumentVO = {
    code?: number
    data?: PageKnowledgeDocumentVO
    message?: string
  }

  type BaseResponseKnowledgeDownloadUrlVO = {
    code?: number
    data?: KnowledgeDownloadUrlVO
    message?: string
  }

  type BaseResponseListKnowledgeChunkVO = {
    code?: number
    data?: KnowledgeChunkVO[]
    message?: string
  }

  type BaseResponseListKnowledgeConversationVO = {
    code?: number
    data?: KnowledgeConversationVO[]
    message?: string
  }

  type BaseResponsePageKnowledgeMessageVO = {
    code?: number
    data?: PageKnowledgeMessageVO
    message?: string
  }

  type BaseResponseKnowledgeChatResponse = {
    code?: number
    data?: KnowledgeChatResponse
    message?: string
  }

  type BaseResponseKnowledgeSourceDocument = {
    code?: number
    data?: KnowledgeSourceDocument
    message?: string
  }

  type BaseResponseKnowledgeNote = {
    code?: number
    data?: KnowledgeNote
    message?: string
  }

  /** 全站设置中心 */
  type SettingModuleVO = {
    code?: string
    displayName?: string
    phase?: string
    writable?: boolean
  }

  type SiteSettingsBootstrapVO = {
    admin?: boolean
    siteName?: string
    siteSlogan?: string
    modules?: SettingModuleVO[]
  }

  type SettingFieldSchemaVO = {
    key?: string
    valueType?: string
    label?: string
    description?: string
    defaultValue?: unknown
    sensitive?: boolean
    min?: number
    max?: number
    enumValues?: string[]
    danger?: boolean
    /** 危险项副作用说明（如需手动重建索引） */
    sideEffect?: string
  }

  type SettingModuleSchemaVO = {
    module?: string
    displayName?: string
    fields?: SettingFieldSchemaVO[]
  }

  type SettingFieldMetaVO = {
    source?: string
    sensitive?: boolean
    configured?: boolean
  }

  /** 敏感字段脱敏形态 */
  type SettingSensitiveValue = {
    configured?: boolean
    hint?: string
  }

  type SettingModuleValuesVO = {
    module?: string
    values?: Record<string, unknown>
    meta?: Record<string, SettingFieldMetaVO>
  }

  type SiteSettingUpdateRequest = {
    items?: Record<string, unknown>
  }

  type IntegrationTestRequest = {
    target?: string
  }

  type IntegrationTestResultVO = {
    target?: string
    ok?: boolean
    latencyMs?: number
    message?: string
  }

  type BaseResponseSiteSettingsBootstrapVO = {
    code?: number
    data?: SiteSettingsBootstrapVO
    message?: string
  }

  type BaseResponseListSettingModuleVO = {
    code?: number
    data?: SettingModuleVO[]
    message?: string
  }

  type BaseResponseSettingModuleSchemaVO = {
    code?: number
    data?: SettingModuleSchemaVO
    message?: string
  }

  type BaseResponseSettingModuleValuesVO = {
    code?: number
    data?: SettingModuleValuesVO
    message?: string
  }

  type BaseResponseIntegrationTestResultVO = {
    code?: number
    data?: IntegrationTestResultVO
    message?: string
  }

  type BaseResponseListIntegrationTestResultVO = {
    code?: number
    data?: IntegrationTestResultVO[]
    message?: string
  }

  type SiteSettingAuditVO = {
    id?: number | string
    module?: string
    settingKey?: string
    oldValue?: string
    newValue?: string
    operatorId?: number | string
    action?: string
    createTime?: string
  }

  type SiteSettingAuditQueryRequest = {
    module?: string
    pageNum?: number
    pageSize?: number
  }

  type PageSiteSettingAuditVO = {
    records?: SiteSettingAuditVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
  }

  type BaseResponsePageSiteSettingAuditVO = {
    code?: number
    data?: PageSiteSettingAuditVO
    message?: string
  }

  /** 运维可观测 · AI 用量汇总 */
  type OpsUsageSummaryVO = {
    requestCount?: number
    successCount?: number
    errorCount?: number
    totalTokens?: number | null
    avgLatencyMs?: number | null
    byScene?: Record<string, number>
    byModel?: Record<string, number>
  }

  type OpsUsageSummaryQueryRequest = {
    from?: string
    to?: string
  }

  type BaseResponseOpsUsageSummaryVO = {
    code?: number
    data?: OpsUsageSummaryVO
    message?: string
  }

  /** 运维可观测 · AI 用量明细 */
  type OpsUsageLogVO = {
    id?: number | string
    userId?: number | string | null
    scene?: string
    conversationId?: number | string | null
    modelName?: string
    promptTokens?: number | null
    completionTokens?: number | null
    totalTokens?: number | null
    responseTimeMs?: number | null
    status?: string
    errorMessage?: string | null
    requestSummary?: string | null
    createTime?: string
  }

  type OpsUsageLogQueryRequest = {
    scene?: string
    userId?: number | string
    from?: string
    to?: string
    pageNum?: number
    pageSize?: number
  }

  type PageOpsUsageLogVO = {
    records?: OpsUsageLogVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
  }

  type BaseResponsePageOpsUsageLogVO = {
    code?: number
    data?: PageOpsUsageLogVO
    message?: string
  }

  /** 运维可观测 · 操作审计 */
  type OpsAuditLogVO = {
    id?: number | string
    operatorId?: number | string | null
    action?: string
    resourceType?: string
    resourceId?: string | null
    ip?: string | null
    detailJson?: string | null
    success?: boolean
    createTime?: string
  }

  type OpsAuditLogQueryRequest = {
    action?: string
    operatorId?: number | string
    from?: string
    to?: string
    pageNum?: number
    pageSize?: number
  }

  type PageOpsAuditLogVO = {
    records?: OpsAuditLogVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
  }

  type BaseResponsePageOpsAuditLogVO = {
    code?: number
    data?: PageOpsAuditLogVO
    message?: string
  }

  /** 运维可观测 · 业务日统计 */
  type OpsBizStatsOverviewVO = {
    totals?: Record<string, number>
  }

  type OpsBizStatsQueryRequest = {
    from?: string
    to?: string
  }

  type BaseResponseOpsBizStatsOverviewVO = {
    code?: number
    data?: OpsBizStatsOverviewVO
    message?: string
  }

  type OpsBizStatsPointVO = {
    date?: string
    value?: number
  }

  type OpsBizStatsSeriesQueryRequest = {
    metric: string
    from?: string
    to?: string
  }

  type BaseResponseListOpsBizStatsPointVO = {
    code?: number
    data?: OpsBizStatsPointVO[]
    message?: string
  }

  /** 运维可观测 · HTTP 访问日志 */
  type OpsAccessLogVO = {
    id?: number | string
    method?: string
    path?: string
    status?: number
    latencyMs?: number
    userId?: number | string | null
    ip?: string | null
    traceId?: string | null
    errorSummary?: string | null
    createTime?: string
  }

  type OpsAccessLogQueryRequest = {
    status?: number | string
    statusClass?: string
    pathPrefix?: string
    from?: string
    to?: string
    pageNum?: number
    pageSize?: number
  }

  type PageOpsAccessLogVO = {
    records?: OpsAccessLogVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
  }

  type BaseResponsePageOpsAccessLogVO = {
    code?: number
    data?: PageOpsAccessLogVO
    message?: string
  }
}
