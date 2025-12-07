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
        submitWork: 'Submit Work'
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
        copyright: '© 2025 APD Project. All data sources belong to their respective owners.'
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
        submitWork: '提交作品'
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
        copyright: '© 2025 APD 项目。所有数据源归其各自所有者所有。'
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
        copyright: '© 2025 APD プロジェクト。すべてのデータソースはそれぞれの所有者に帰属します。'
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

