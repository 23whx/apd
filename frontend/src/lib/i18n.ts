import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        works: 'Works',
        characters: 'Characters',
        login: 'Login',
        logout: 'Logout',
        profile: 'Profile',
        submitWork: 'Submit Work',
        blog: 'Blog'
      },
      hero: {
        status: 'System Online',
        title: 'ACGN Personality Database',
        subtitle: 'Decode the psyche of your favorite characters.',
        description: 'Submit works, analyze traits, and vote on MBTI, Enneagram, and more.',
        searchPlaceholder: 'Search anime, manga, games, or characters...',
        scanButton: 'SCAN'
      },
      stats: {
        characters: 'Characters',
        votes: 'Votes',
        works: 'Works',
        uptime: 'Uptime'
      },
      trending: {
        title: 'Trending Entries',
        viewAll: 'View All',
        charactersCount: 'Characters',
        votesCount: 'Votes'
      },
      workTypes: {
        anime: 'Anime',
        manga: 'Manga',
        game: 'Game',
        novel: 'Novel'
      },
      personality: {
        mbti: 'MBTI',
        enneagram: 'Enneagram',
        subtype: 'Subtype',
        yiHexagram: 'Yi Hexagram'
      },
      footer: {
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        about: 'About',
        api: 'API',
        copyright: '© 2025 APD Project. All data sources belong to their respective owners.',
        description: 'ACGN Personality Database - Explore character personalities through community voting and discussion.',
        quickLinks: 'Quick Links',
        relatedProjects: 'Related Projects',
        madeWith: 'Made with',
        byRollkey: 'by Rollkey'
      },
      profile: {
        title: 'Profile Settings',
        email: 'Email',
        username: 'Username',
        displayName: 'Display Name',
        chooseAvatar: 'Choose Avatar (Preset)',
        selectedAvatar: 'Selected Avatar',
        memberSince: 'Member Since',
        saveChanges: 'Save Changes',
        saving: 'Saving...',
        updateSuccess: 'Profile updated successfully! ✓',
        updateSuccessDesc: 'Your profile has been updated successfully!',
        myActivity: 'My Activity',
        worksSubmitted: 'Works Submitted',
        votesCast: 'Votes Cast',
        comments: 'Comments'
      },
      common: {
        confirm: 'OK',
        error: 'Error',
        backTo: 'Back to',
        viewSource: 'View Source',
        characterNotFound: 'Character not found',
        backToWorks: 'Back to works',
        from: 'From'
      },
      characterDetail: {
        votingResults: 'Personality Voting Results',
        mbti: 'MBTI',
        enneagram: 'Enneagram',
        subtype: 'Subtype',
        yiHexagram: 'Yi Hexagram'
      },
      votePanel: {
        updateVote: 'Update Your Vote',
        castVote: 'Cast Your Vote',
        mbtiType: 'MBTI Type',
        enneagramWithWing: 'Enneagram (with wing)',
        subtypeVariant: 'Subtype (Instinctual Variant)',
        yiHexagram: 'Yi Hexagram (64 Hexagrams)',
        selectMbti: 'Select MBTI',
        selectEnneagram: 'Select Enneagram',
        selectSubtype: 'Select Subtype',
        selectYiHexagram: 'Select Hexagram',
        submitVote: 'Submit Vote',
        updateButton: 'Update Vote',
        submitting: 'Submitting...',
        voteTip: 'You can vote for one or multiple personality types',
        spNote: 'sp = Self-Preservation, sx = Sexual, so = Social'
      },
      comments: {
        title: 'Comments',
        sortNewest: 'Newest First',
        sortOldest: 'Oldest First',
        alreadyCommented: 'You have already commented. You can edit or delete your comment below.',
        oncePerTarget: 'Each user can only comment once per work/character.',
        placeholder: 'Share your thoughts... (You can only comment once)',
        postComment: 'Post Comment',
        posting: 'Posting...',
        loginToComment: 'Please login to comment',
        noComments: 'No comments yet',
        you: 'You',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel'
      },
      blog: {
        title: 'Blog Articles',
        subtitle: 'Explore personality theories, anime character analysis, and tech sharing',
        searchPlaceholder: 'Search articles by title, content, or tags...',
        categories: {
          all: 'All',
          mbti: 'MBTI',
          enneagramTypes: 'Enneagram Types',
          enneagramWings: 'Enneagram Wings',
          enneagramInstincts: 'Enneagram Instincts',
          yixue: 'YiXue Personality',
          tech: 'Tech',
          other: 'Other'
        },
        noArticles: 'No articles yet',
        readMore: 'READ MORE',
        readOriginal: 'Visit Original',
        externalLink: 'External',
        showingCount: 'Showing {{count}} articles',
        views: 'views',
        backToBlogList: 'Back to Blog List',
        viewMoreArticles: 'View More Articles',
        articleNotFound: 'Article Not Found',
        readCount: '{{count}} views',
        tags: 'Tags',
        sortNewest: 'Newest First',
        sortOldest: 'Oldest First',
        networkError: 'Network error: failed to load posts.',
        retry: 'Retry',
        networkHint: 'If this persists, check VPN/proxy/firewall or whether your network blocks Supabase/Google requests.',
        share: 'Share',
        shareTitle: 'Share Article',
        weibo: 'Weibo',
        copy: 'Copy',
        copied: 'Copied!',
        shareNotice: 'Share this article with your friends',
        copyDisabled: 'Content copying is disabled. Please share via the share button.'
      }
    }
  },
  zh: {
    translation: {
      nav: {
        works: '作品',
        characters: '角色',
        login: '登录',
        logout: '退出',
        profile: '个人中心',
        submitWork: '提交作品',
        blog: '博客'
      },
      hero: {
        status: '系统在线',
        title: 'ACGN 人格数据库',
        subtitle: '解析你最喜爱角色的心理特质',
        description: '提交作品、分析特质、投票 MBTI、九型人格等',
        searchPlaceholder: '搜索动漫、漫画、游戏或角色...',
        scanButton: '扫描'
      },
      stats: {
        characters: '角色',
        votes: '投票',
        works: '作品',
        uptime: '在线率'
      },
      trending: {
        title: '热门条目',
        viewAll: '查看全部',
        charactersCount: '个角色',
        votesCount: '次投票'
      },
      workTypes: {
        anime: '动画',
        manga: '漫画',
        game: '游戏',
        novel: '小说'
      },
      personality: {
        mbti: 'MBTI类型',
        enneagram: '九型人格',
        subtype: '副型',
        yiHexagram: '易学六十四卦'
      },
      footer: {
        privacy: '隐私政策',
        terms: '服务条款',
        about: '关于',
        api: 'API',
        copyright: '© 2025 APD 项目。所有数据源归其各自所有者所有。',
        description: 'ACGN 人格数据库 - 通过社区投票和讨论探索角色人格。',
        quickLinks: '快速链接',
        relatedProjects: '相关项目',
        madeWith: '用',
        byRollkey: '制作 by Rollkey'
      },
      profile: {
        title: '个人设置',
        email: '邮箱',
        username: '用户名',
        displayName: '显示名称',
        chooseAvatar: '选择头像（预设）',
        selectedAvatar: '已选头像',
        memberSince: '注册时间',
        saveChanges: '保存更改',
        saving: '保存中...',
        updateSuccess: '修改成功！',
        updateSuccessDesc: '您的个人资料已成功更新！',
        myActivity: '我的活动',
        worksSubmitted: '提交的作品',
        votesCast: '投票次数',
        comments: '评论'
      },
      common: {
        confirm: '确定',
        error: '错误',
        backTo: '返回',
        viewSource: '查看来源',
        characterNotFound: '角色未找到',
        backToWorks: '返回作品列表',
        from: '来自'
      },
      characterDetail: {
        votingResults: '人格投票结果',
        mbti: 'MBTI类型',
        enneagram: '九型人格',
        subtype: '副型',
        yiHexagram: '易学卦象'
      },
      votePanel: {
        updateVote: '更新你的投票',
        castVote: '投票',
        mbtiType: 'MBTI 类型',
        enneagramWithWing: '九型人格（带侧翼）',
        subtypeVariant: '副型（本能变体）',
        yiHexagram: '易学六十四卦',
        selectMbti: '选择 MBTI',
        selectEnneagram: '选择九型',
        selectSubtype: '选择副型',
        selectYiHexagram: '选择卦象',
        submitVote: '提交投票',
        updateButton: '更新投票',
        submitting: '提交中...',
        voteTip: '你可以投一种或多种人格类型',
        spNote: 'sp = 自保型, sx = 性本能型, so = 社交型'
      },
      comments: {
        title: '评论',
        sortNewest: '最新在前',
        sortOldest: '最早在前',
        alreadyCommented: '你已经评论过了。可以在下方编辑或删除你的评论。',
        oncePerTarget: '每个用户只能对每个作品/角色评论一次。',
        placeholder: '分享你的想法...（只能评论一次）',
        postComment: '发表评论',
        posting: '发表中...',
        loginToComment: '请登录后评论',
        noComments: '暂无评论',
        you: '你',
        edit: '编辑',
        delete: '删除',
        save: '保存',
        cancel: '取消'
      },
      blog: {
        title: '博客文章',
        subtitle: '探索人格理论、动漫角色分析与技术分享',
        searchPlaceholder: '搜索文章标题、内容或标签...',
        categories: {
          all: '全部',
          mbti: 'MBTI',
          enneagramTypes: '九型类型',
          enneagramWings: '九型侧翼',
          enneagramInstincts: '九型副型',
          yixue: '易学人格学',
          tech: '技术',
          other: '其他'
        },
        noArticles: '暂无文章',
        readMore: '阅读更多',
        readOriginal: '访问原文',
        externalLink: '外链',
        showingCount: '显示 {{count}} 篇文章',
        views: '次浏览',
        backToBlogList: '返回博客列表',
        viewMoreArticles: '查看更多文章',
        articleNotFound: '文章未找到',
        readCount: '{{count}} 次阅读',
        tags: '标签',
        sortNewest: '最新在前',
        sortOldest: '最早在前',
        networkError: '网络异常：无法加载文章列表。',
        retry: '重试',
        networkHint: '如果一直失败，请检查 VPN/代理/防火墙，或当前网络是否拦截 Supabase/Google 请求。',
        share: '分享',
        shareTitle: '分享文章',
        weibo: '微博',
        copy: '复制',
        copied: '已复制！',
        shareNotice: '将这篇文章分享给你的朋友',
        copyDisabled: '内容复制已禁用，请通过分享按钮分享文章。'
      }
    }
  },
  ja: {
    translation: {
      nav: {
        works: '作品',
        characters: 'キャラクター',
        login: 'ログイン',
        logout: 'ログアウト',
        profile: 'プロフィール',
        submitWork: '作品を投稿'
      },
      hero: {
        status: 'システムオンライン',
        title: 'ACGN パーソナリティデータベース',
        subtitle: 'お気に入りのキャラクターの心理を解析',
        description: '作品を投稿し、特性を分析し、MBTIやエニアグラムなどに投票',
        searchPlaceholder: 'アニメ、漫画、ゲーム、キャラクターを検索...',
        scanButton: 'スキャン'
      },
      stats: {
        characters: 'キャラクター',
        votes: '投票',
        works: '作品',
        uptime: '稼働率'
      },
      trending: {
        title: 'トレンド',
        viewAll: 'すべて表示',
        charactersCount: 'キャラクター',
        votesCount: '投票'
      },
      workTypes: {
        anime: 'アニメ',
        manga: '漫画',
        game: 'ゲーム',
        novel: '小説'
      },
      personality: {
        mbti: 'MBTIタイプ',
        enneagram: 'エニアグラム',
        subtype: 'サブタイプ',
        yiHexagram: '易学六十四卦'
      },
      footer: {
        privacy: 'プライバシーポリシー',
        terms: '利用規約',
        about: 'について',
        api: 'API',
        copyright: '© 2025 APD プロジェクト。すべてのデータソースはそれぞれの所有者に帰属します。',
        description: 'ACGN パーソナリティデータベース - コミュニティ投票とディスカッションを通じてキャラクター性格を探索。',
        quickLinks: 'クイックリンク',
        relatedProjects: '関連プロジェクト',
        madeWith: '',
        byRollkey: '💚で作成 by Rollkey'
      },
      profile: {
        title: 'プロフィール設定',
        email: 'メール',
        username: 'ユーザー名',
        displayName: '表示名',
        chooseAvatar: 'アバターを選択（プリセット）',
        selectedAvatar: '選択したアバター',
        memberSince: '登録日',
        saveChanges: '変更を保存',
        saving: '保存中...',
        updateSuccess: '変更成功！',
        updateSuccessDesc: 'プロフィールが正常に更新されました！',
        myActivity: 'マイアクティビティ',
        worksSubmitted: '提出した作品',
        votesCast: '投票数',
        comments: 'コメント'
      },
      common: {
        confirm: 'OK',
        error: 'エラー',
        backTo: '戻る',
        viewSource: 'ソースを表示',
        characterNotFound: 'キャラクターが見つかりません',
        backToWorks: '作品リストに戻る',
        from: '出典'
      },
      characterDetail: {
        votingResults: 'パーソナリティ投票結果',
        mbti: 'MBTIタイプ',
        enneagram: 'エニアグラム',
        subtype: 'サブタイプ',
        yiHexagram: '易学卦象'
      },
      votePanel: {
        updateVote: '投票を更新',
        castVote: '投票する',
        mbtiType: 'MBTIタイプ',
        enneagramWithWing: 'エニアグラム（ウィング付き）',
        subtypeVariant: 'サブタイプ（本能的バリアント）',
        yiHexagram: '易学六十四卦',
        selectMbti: 'MBTIを選択',
        selectEnneagram: 'エニアグラムを選択',
        selectSubtype: 'サブタイプを選択',
        selectYiHexagram: '卦象を選択',
        submitVote: '投票を提出',
        updateButton: '投票を更新',
        submitting: '提出中...',
        voteTip: '1つまたは複数のパーソナリティタイプに投票できます',
        spNote: 'sp = 自己保存、sx = 性的、so = 社会的'
      },
      comments: {
        title: 'コメント',
        sortNewest: '最新順',
        sortOldest: '古い順',
        alreadyCommented: 'すでにコメントしています。以下で編集または削除できます。',
        oncePerTarget: '各ユーザーは作品/キャラクターごとに1回のみコメントできます。',
        placeholder: '感想を共有...（コメントは1回のみ）',
        postComment: 'コメントを投稿',
        posting: '投稿中...',
        loginToComment: 'コメントするにはログインしてください',
        noComments: 'まだコメントがありません',
        you: 'あなた',
        edit: '編集',
        delete: '削除',
        save: '保存',
        cancel: 'キャンセル'
      },
      blog: {
        title: 'ブログ記事',
        subtitle: 'パーソナリティ理論、アニメキャラクター分析、技術シェアを探索',
        searchPlaceholder: 'タイトル、内容、タグで記事を検索...',
        categories: {
          all: 'すべて',
          mbti: 'MBTI',
          enneagramTypes: 'エニアグラムタイプ',
          enneagramWings: 'エニアグラムウィング',
          enneagramInstincts: 'エニアグラム本能',
          yixue: '易学パーソナリティ',
          tech: 'テクノロジー',
          other: 'その他'
        },
        noArticles: '記事はまだありません',
        readMore: '続きを読む',
        readOriginal: '元記事を見る',
        externalLink: '外部リンク',
        showingCount: '{{count}}件の記事を表示',
        views: '閲覧',
        backToBlogList: 'ブログ一覧に戻る',
        viewMoreArticles: 'もっと記事を見る',
        articleNotFound: '記事が見つかりません',
        readCount: '{{count}}回閲覧',
        tags: 'タグ',
        sortNewest: '新しい順',
        sortOldest: '古い順',
        networkError: 'ネットワークエラー：記事一覧を読み込めません。',
        retry: '再試行',
        networkHint: '解決しない場合は VPN/プロキシ/ファイアウォール、またはネットワークが Supabase/Google をブロックしていないか確認してください。',
        share: 'シェア',
        shareTitle: '記事をシェア',
        weibo: 'Weibo',
        copy: 'コピー',
        copied: 'コピーしました！',
        shareNotice: 'この記事を友達とシェア',
        copyDisabled: 'コンテンツのコピーは無効です。シェアボタンから共有してください。'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default to English, will be overridden by geo-detection
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

