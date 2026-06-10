import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import {
  Sparkles, Copy, Check, RefreshCw, ChevronLeft, Newspaper,
  MessageSquare, Hash, ArrowRight, Clock, Zap
} from "lucide-react";

const POST_TYPES = [
  "NDIS News Update",
  "Disability Awareness Tip",
  "Referral Program Promo",
  "Service Highlight",
  "Motivational & Inspiring",
  "NDIS Funding Tip",
  "Community Support Story",
];

const POST_TYPE_ICONS: Record<string, string> = {
  "NDIS News Update": "📢",
  "Disability Awareness Tip": "💡",
  "Referral Program Promo": "🎁",
  "Service Highlight": "⭐",
  "Motivational & Inspiring": "🌟",
  "NDIS Funding Tip": "💰",
  "Community Support Story": "❤️",
};

interface ContentPost {
  post_type: string;
  hook: string;
  main_text: string;
  description_hashtags: string;
  first_comment: string;
  news_headlines?: string[];
  created_at: number;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied
          ? "bg-green-100 text-green-700 border border-green-300"
          : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : `Copy ${label}`}
    </button>
  );
}

function SectionCard({
  icon: Icon,
  label,
  color,
  content,
  copyLabel,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  content: string;
  copyLabel: string;
}) {
  return (
    <div className={`rounded-xl border ${color} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <CopyButton text={content} label={copyLabel} />
      </div>
      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
    </div>
  );
}

export default function DailyContent() {
  const { loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(POST_TYPES[new Date().getDay() % POST_TYPES.length]);
  const [generating, setGenerating] = useState(false);
  const [currentPost, setCurrentPost] = useState<ContentPost | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) loadHistory();
  }, [isAuthenticated]);

  const loadHistory = async () => {
    try {
      const data = await api.getContentHistory();
      setHistory(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const data = await api.generateContent(selectedType);
      const post = data.post;
      // Parse if content is stored as JSON string
      if (post.content && !post.hook) {
        try {
          const parsed = JSON.parse(post.content);
          Object.assign(post, parsed);
        } catch (e) {}
      }
      setCurrentPost(post);
      loadHistory();
    } catch (e: any) {
      setError("Failed to generate content. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const loadHistoryPost = (post: any) => {
    let parsed = post;
    if (post.content && !post.hook) {
      try { parsed = { ...post, ...JSON.parse(post.content) }; } catch (e) {}
    }
    setCurrentPost(parsed);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/admin")} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <div>
            <h1 className="font-bold text-base">Daily Content Generator</h1>
            <p className="text-xs text-slate-400">AI-powered Facebook Reel posts using live NDIS news</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Generate Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-800">Generate Today's Post</span>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 mb-2 block">Post Type</label>
            <div className="grid grid-cols-2 gap-2">
              {POST_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                    selectedType === type
                      ? "bg-amber-50 border-amber-400 text-amber-800"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>{POST_TYPE_ICONS[type]}</span>
                  <span className="flex-1">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-all disabled:opacity-60"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Fetching live NDIS news & generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Post with Live NDIS News
              </>
            )}
          </button>
        </div>

        {/* Generated Post */}
        {currentPost && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{POST_TYPE_ICONS[currentPost.post_type] || "📝"}</span>
                <span className="font-semibold text-slate-800">{currentPost.post_type}</span>
              </div>
              <button
                onClick={() => {
                  const full = [currentPost.hook, currentPost.main_text, currentPost.description_hashtags].filter(Boolean).join("\n\n");
                  navigator.clipboard.writeText(full);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Full Post
              </button>
            </div>

            {/* News context banner */}
            {currentPost.news_headlines && currentPost.news_headlines.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">Based on today's live NDIS news</span>
                </div>
                {currentPost.news_headlines.map((h, i) => (
                  <p key={i} className="text-xs text-blue-600 leading-relaxed">• {h}</p>
                ))}
              </div>
            )}

            {/* Section 1: Hook */}
            {currentPost.hook && (
              <SectionCard
                icon={ArrowRight}
                label="1. Hook (First 1–2 Lines)"
                color="border-amber-200 bg-amber-50 text-amber-900"
                content={currentPost.hook}
                copyLabel="Hook"
              />
            )}

            {/* Section 2: Main Text */}
            {currentPost.main_text && (
              <SectionCard
                icon={MessageSquare}
                label="2. Main Text"
                color="border-slate-200 bg-white text-slate-800"
                content={currentPost.main_text}
                copyLabel="Main Text"
              />
            )}

            {/* Section 3: Description + Hashtags */}
            {currentPost.description_hashtags && (
              <SectionCard
                icon={Hash}
                label="3. Description + Hashtags"
                color="border-purple-200 bg-purple-50 text-purple-900"
                content={currentPost.description_hashtags}
                copyLabel="Description"
              />
            )}

            {/* Section 4: First Comment */}
            {currentPost.first_comment && (
              <SectionCard
                icon={MessageSquare}
                label="4. First Comment (paste after posting)"
                color="border-green-200 bg-green-50 text-green-900"
                content={currentPost.first_comment}
                copyLabel="First Comment"
              />
            )}
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-800">Recent Posts</span>
            <span className="text-xs text-slate-400">(last 14 days)</span>
          </div>

          {historyLoading ? (
            <div className="text-center py-6 text-slate-400 text-sm">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No posts generated yet. Click Generate above!</div>
          ) : (
            <div className="space-y-2">
              {history.map((post, i) => {
                let parsed = post;
                if (post.content && !post.hook) {
                  try { parsed = { ...post, ...JSON.parse(post.content) }; } catch (e) {}
                }
                return (
                  <button
                    key={i}
                    onClick={() => loadHistoryPost(post)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all text-left"
                  >
                    <span className="text-lg flex-shrink-0">{POST_TYPE_ICONS[post.post_type] || "📝"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700">{post.post_type}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {parsed.hook ? parsed.hook.split("\n")[0] : "Click to view"}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(post.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
