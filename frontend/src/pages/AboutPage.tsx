import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Users, Target, Code, Mail, ExternalLink, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AboutPage: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {i18n.language === 'zh' ? '返回首页' : i18n.language === 'ja' ? 'ホームに戻る' : 'Back to Home'}
      </Link>

      <div className="bg-eva-surface border border-white/10 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-8 h-8 text-eva-secondary" />
          <h1 className="text-4xl font-bold">
            {i18n.language === 'zh' ? '关于 APD' : i18n.language === 'ja' ? 'APDについて' : 'About APD'}
          </h1>
        </div>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-eva-accent" />
              {i18n.language === 'zh' ? '项目愿景' : i18n.language === 'ja' ? 'プロジェクトビジョン' : 'Project Vision'}
            </h2>
            <p className="mb-4">
              {i18n.language === 'zh'
                ? 'APD（ACGN Personality Database）旨在为ACGN爱好者打造一个开放、共享的角色人格分析平台。我们相信，通过社区的集体智慧，能够更深入地理解和欣赏我们喜爱的角色。'
                : i18n.language === 'ja'
                ? 'APD（ACGN Personality Database）は、ACGNファンのためのオープンで共有可能なキャラクター性格分析プラットフォームを構築することを目指しています。コミュニティの集合知により、私たちが愛するキャラクターをより深く理解し、鑑賞できると信じています。'
                : 'APD (ACGN Personality Database) aims to create an open, shared platform for ACGN enthusiasts to analyze character personalities. We believe that through the collective wisdom of the community, we can gain deeper understanding and appreciation of the characters we love.'}
            </p>
            <p>
              {i18n.language === 'zh'
                ? '本项目完全开源、非盈利，所有功能免费使用。我们致力于为全球ACGN社区提供一个专业、友好的角色人格分析工具。'
                : i18n.language === 'ja'
                ? 'このプロジェクトは完全にオープンソースで非営利であり、すべての機能は無料で使用できます。世界中のACGNコミュニティに専門的でフレンドリーなキャラクター性格分析ツールを提供することに取り組んでいます。'
                : 'This project is completely open-source and non-profit, with all features free to use. We are committed to providing a professional and friendly character personality analysis tool for the global ACGN community.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-eva-accent" />
              {i18n.language === 'zh' ? '核心功能' : i18n.language === 'ja' ? 'コア機能' : 'Core Features'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-eva-secondary mb-2">
                  {i18n.language === 'zh' ? '🗳️ 投票系统' : i18n.language === 'ja' ? '🗳️ 投票システム' : '🗳️ Voting System'}
                </h3>
                <p className="text-sm">
                  {i18n.language === 'zh'
                    ? '为角色的MBTI、九型人格、副型和易学卦象投票，汇聚社区智慧。'
                    : i18n.language === 'ja'
                    ? 'キャラクターのMBTI、エニアグラム、サブタイプ、易学卦象に投票し、コミュニティの知恵を結集。'
                    : 'Vote on characters\' MBTI, Enneagram, Subtypes, and I Ching hexagrams, aggregating community wisdom.'}
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-eva-secondary mb-2">
                  {i18n.language === 'zh' ? '📊 数据可视化' : i18n.language === 'ja' ? '📊 データ可視化' : '📊 Data Visualization'}
                </h3>
                <p className="text-sm">
                  {i18n.language === 'zh'
                    ? '直观的图表展示投票结果和人格分布，一目了然。'
                    : i18n.language === 'ja'
                    ? '投票結果と性格分布を直感的なグラフで表示、一目瞭然。'
                    : 'Intuitive charts displaying voting results and personality distributions at a glance.'}
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-eva-secondary mb-2">
                  {i18n.language === 'zh' ? '💬 社区讨论' : i18n.language === 'ja' ? '💬 コミュニティディスカッション' : '💬 Community Discussion'}
                </h3>
                <p className="text-sm">
                  {i18n.language === 'zh'
                    ? '评论区让用户分享见解、讨论角色人格特质。'
                    : i18n.language === 'ja'
                    ? 'コメント欄でユーザーが洞察を共有し、キャラクターの性格特性について議論。'
                    : 'Comment sections allowing users to share insights and discuss character personality traits.'}
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-eva-secondary mb-2">
                  {i18n.language === 'zh' ? '🌐 多语言支持' : i18n.language === 'ja' ? '🌐 多言語サポート' : '🌐 Multi-language Support'}
                </h3>
                <p className="text-sm">
                  {i18n.language === 'zh'
                    ? '支持中文、英文、日文三种语言，服务全球用户。'
                    : i18n.language === 'ja'
                    ? '中国語、英語、日本語の3言語をサポート、グローバルユーザーにサービス提供。'
                    : 'Support for Chinese, English, and Japanese, serving global users.'}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Code className="w-6 h-6 text-eva-accent" />
              {i18n.language === 'zh' ? '技术栈' : i18n.language === 'ja' ? '技術スタック' : 'Tech Stack'}
            </h2>
            <div className="bg-black/30 rounded-lg p-4">
              <ul className="space-y-2">
                <li><strong>{i18n.language === 'zh' ? '前端：' : i18n.language === 'ja' ? 'フロントエンド：' : 'Frontend:'}</strong> React 19 + TypeScript + Vite + Tailwind CSS</li>
                <li><strong>{i18n.language === 'zh' ? '后端：' : i18n.language === 'ja' ? 'バックエンド：' : 'Backend:'}</strong> Supabase (PostgreSQL + Auth + Storage + RLS)</li>
                <li><strong>{i18n.language === 'zh' ? '部署：' : i18n.language === 'ja' ? 'デプロイ：' : 'Deployment:'}</strong> Vercel (Frontend) + Supabase (Database)</li>
                <li><strong>{i18n.language === 'zh' ? '国际化：' : i18n.language === 'ja' ? '国際化：' : 'i18n:'}</strong> react-i18next</li>
                <li><strong>{i18n.language === 'zh' ? '图表：' : i18n.language === 'ja' ? 'チャート：' : 'Charts:'}</strong> Recharts</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-eva-accent" />
              {i18n.language === 'zh' ? '开发者介绍' : i18n.language === 'ja' ? '開発者紹介' : 'Developer Introduction'}
            </h2>
            <div className="bg-gradient-to-br from-eva-accent/10 to-eva-secondary/10 border border-eva-accent/30 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-eva-accent/50">
                  <img 
                    src="/admin_img.jpg" 
                    alt="Rollkey" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Rollkey</h3>
                  <p className="text-sm text-gray-400">
                    {i18n.language === 'zh' ? '中文名：小学生滚键式' : i18n.language === 'ja' ? '中国語名：小学生滚键式' : 'Chinese Name: 小学生滚键式'}
                  </p>
                </div>
              </div>
              <p className="mb-4">
                {i18n.language === 'zh'
                  ? '一名普通的独立开发者，也是人格学与心理学的长期爱好者，尤其沉迷于日本动漫里那些鲜活而复杂的灵魂。平日喜欢把零散的阅读、观察与思考整理成更易理解的科普内容；也希望用代码把这些知识“做成工具”，把讨论变得更有依据、更有趣。若能凭借技术与分享，为业界与社区添上一点点微光，帮助更多人更系统地理解人格类型学，并将其自然地用在角色分析与自我探索中，就已经足够值得。'
                  : i18n.language === 'ja'
                  ? 'ごく普通の個人開発者で、性格心理学やタイプ論が好きです。日本アニメに登場する“生きた心”の描写に惹かれ、日々の読書や観察、考察を、できるだけ分かりやすい形にまとめて発信しています。技術の力で知識を「使える形」に落とし込み、議論をもっと根拠あるものにし、そしてもっと楽しくしたい——そんな思いでこのプロジェクトを続けています。小さな貢献でも、誰かがタイプ論をより体系的に理解し、キャラクター分析や自己理解に自然に活かせるきっかけになれば嬉しいです。'
                  : 'An independent developer and long-time enthusiast of personality typology and psychology, with a special love for Japanese anime and its richly written characters. I enjoy turning scattered notes, reading, and observations into approachable, educational content—and building small tools that make those ideas more practical. Through technology and knowledge sharing, I hope to contribute a modest spark to the community and help more people understand personality frameworks in a systematic way, applying them naturally to character analysis and self-reflection.'}
              </p>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-eva-accent" />
                  <strong>{i18n.language === 'zh' ? '邮箱：' : i18n.language === 'ja' ? 'メール：' : 'Email:'}</strong>
                  <a href="mailto:wanghongxiang23@gmail.com" className="text-eva-secondary hover:underline">
                    wanghongxiang23@gmail.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-eva-accent" />
                  <strong>X (Twitter):</strong>
                  <a href="https://x.com/Rollkey4" target="_blank" rel="noopener noreferrer" className="text-eva-secondary hover:underline">
                    @Rollkey4
                  </a>
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/20">
                <h4 className="text-sm font-bold text-eva-accent mb-3">
                  {i18n.language === 'zh' ? '🌐 其他项目' : i18n.language === 'ja' ? '🌐 その他のプロジェクト' : '🌐 Other Projects'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <ExternalLink className="w-4 h-4 text-eva-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <a href="https://oumashu.top" target="_blank" rel="noopener noreferrer" className="text-eva-secondary hover:underline font-medium">
                        OumaShu ({i18n.language === 'zh' ? '小工具聚合导航站' : i18n.language === 'ja' ? 'ツール集約ナビゲーション' : 'Tools Directory'})
                      </a>
                      <p className="text-gray-400 text-xs mt-1">
                        {i18n.language === 'zh' 
                          ? '精心策划的免费在线工具目录，涵盖文本、图片、视频、娱乐等多个领域。'
                          : i18n.language === 'ja' 
                          ? 'テキスト、画像、動画、エンターテインメントなど、さまざまな分野をカバーする無料オンラインツールディレクトリ。'
                          : 'Curated directory of free online tools covering text, images, videos, entertainment, and more.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ExternalLink className="w-4 h-4 text-eva-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <a href="https://efortunetell.blog" target="_blank" rel="noopener noreferrer" className="text-eva-secondary hover:underline font-medium">
                        eFortuneTell ({i18n.language === 'zh' ? '命理学博客' : i18n.language === 'ja' ? '占い学ブログ' : 'Metaphysics Blog'})
                      </a>
                      <p className="text-gray-400 text-xs mt-1">
                        {i18n.language === 'zh' 
                          ? '专业的中国传统命理学在线平台，提供八字、奇门遁甲、大六壬等传统占卜服务和知识分享。'
                          : i18n.language === 'ja' 
                          ? '伝統的な中国占術のオンラインプラットフォーム。四柱推命、奇門遁甲、大六壬などの伝統占いサービスと知識共有を提供。'
                          : 'Professional Chinese metaphysics platform offering traditional divination services including BaZi, Qimen Dunjia, and Da Liu Ren, with knowledge sharing.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {i18n.language === 'zh' ? '🤝 社区贡献' : i18n.language === 'ja' ? '🤝 コミュニティ貢献' : '🤝 Community Contribution'}
            </h2>
            <p className="mb-3">
              {i18n.language === 'zh'
                ? 'APD 是一个社区驱动的项目，我们欢迎所有形式的贡献：'
                : i18n.language === 'ja'
                ? 'APDはコミュニティ主導のプロジェクトであり、あらゆる形式の貢献を歓迎します：'
                : 'APD is a community-driven project, and we welcome all forms of contribution:'}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{i18n.language === 'zh' ? '提交新的作品和角色信息' : i18n.language === 'ja' ? '新しい作品とキャラクター情報の提出' : 'Submit new works and character information'}</li>
              <li>{i18n.language === 'zh' ? '参与人格类型投票和讨论' : i18n.language === 'ja' ? '性格タイプの投票とディスカッションへの参加' : 'Participate in personality type voting and discussions'}</li>
              <li>{i18n.language === 'zh' ? '报告Bug和提出改进建议' : i18n.language === 'ja' ? 'バグ報告と改善提案' : 'Report bugs and suggest improvements'}</li>
              <li>{i18n.language === 'zh' ? '分享项目给更多ACGN爱好者' : i18n.language === 'ja' ? 'プロジェクトをより多くのACGNファンと共有' : 'Share the project with more ACGN enthusiasts'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {i18n.language === 'zh' ? '📝 免责声明' : i18n.language === 'ja' ? '📝 免責事項' : '📝 Disclaimer'}
            </h2>
            <p className="text-sm text-gray-400">
              {i18n.language === 'zh'
                ? 'APD 提供的人格分析结果基于社区投票和讨论，仅供娱乐和参考。这些分析不代表官方观点，也不构成专业的心理学建议。所有角色版权归其各自的创作者和版权所有者所有。'
                : i18n.language === 'ja'
                ? 'APDが提供する性格分析結果はコミュニティの投票と議論に基づいており、エンターテインメントと参考用です。これらの分析は公式見解を表すものではなく、専門的な心理学的アドバイスでもありません。すべてのキャラクターの著作権は、それぞれの制作者と著作権所有者に帰属します。'
                : 'The personality analysis results provided by APD are based on community voting and discussion, for entertainment and reference only. These analyses do not represent official views nor constitute professional psychological advice. All character copyrights belong to their respective creators and copyright holders.'}
            </p>
          </section>

          <section className="border-t border-white/10 pt-6">
            <p className="text-center text-gray-400">
              {i18n.language === 'zh'
                ? '感谢您使用 APD！让我们一起探索ACGN角色的内心世界 💚'
                : i18n.language === 'ja'
                ? 'APDをご利用いただきありがとうございます！一緒にACGNキャラクターの内面世界を探索しましょう 💚'
                : 'Thank you for using APD! Let\'s explore the inner world of ACGN characters together 💚'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

