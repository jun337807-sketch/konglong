import React, { useState, useEffect } from 'react';
import { X, Film, Play, Loader2, CheckCircle2, AlertCircle, Key, Image as ImageIcon, Settings2 } from 'lucide-react';

interface VideoGeneratorProps {
  onClose: () => void;
}

export function VideoGenerator({ onClose }: VideoGeneratorProps) {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('全程使用视频1的第一视角构图，全程使用音频1作为背景音乐。第一人称视角果茶宣传广告，seedance牌「苹苹安安」苹果果茶限定款；首帧为图片1，你的手摘下一颗带晨露的阿克苏红苹果，轻脆的苹果碰撞声；2-4 秒：快速切镜，你的手将苹果块投入雪克杯，加入冰块与茶底，用力摇晃，冰块碰撞声与摇晃声卡点轻快鼓点，背景音：「鲜切现摇」；4-6 秒：第一人称成品特写，分层果茶倒入透明杯，你的手轻挤奶盖在顶部铺展，在杯身贴上粉红包标，镜头拉近看奶盖与果茶的分层纹理；6-8 秒：第一人称手持举杯，你将图片2中的果茶举到镜头前（模拟递到观众面前的视角），杯身标签清晰可见，背景音「来一口鲜爽」，尾帧定格为图片2。背景声音统一为女生音色。');
  const [img1Url, setImg1Url] = useState('https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_tea_pic1.jpg');
  const [img2Url, setImg2Url] = useState('https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_tea_pic2.jpg');
  const [ratio, setRatio] = useState('16:9');
  const [duration, setDuration] = useState(11);

  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError("❌ 请先在左侧填入你的 火山引擎 API Key！");
      return;
    }
    if (!prompt.trim()) {
      setError("❌ 请填写导演提示词！");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setStatus('正在提交任务...');
    setVideoUrl(null);

    const contentList: any[] = [{ type: "text", text: prompt }];
    if (img1Url.trim()) {
      contentList.push({ type: "image_url", image_url: { url: img1Url.trim() }, role: "reference_image" });
    }
    if (img2Url.trim()) {
      contentList.push({ type: "image_url", image_url: { url: img2Url.trim() }, role: "reference_image" });
    }

    try {
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/content_generation/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: "doubao-seedance-2-0-260128",
          content: contentList,
          generate_audio: true,
          ratio: ratio,
          duration: Number(duration),
          watermark: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      setTaskId(data.id);
      setStatus(`🎬 任务已提交，Task ID: ${data.id}，正在渲染中...`);
    } catch (err: any) {
      setError(`请求发生异常: ${err.message}`);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollTask = async () => {
      if (!taskId) return;

      try {
        const response = await fetch(`https://ark.cn-beijing.volces.com/api/v3/content_generation/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`
          }
        });

        if (!response.ok) {
          throw new Error(`Polling failed with status: ${response.status}`);
        }

        const data = await response.json();
        const currentStatus = data.status;

        if (currentStatus === 'succeeded') {
          setStatus('✅ 视频渲染成功！');
          
          let finalUrl = '';
          if (data.content?.video_url?.url) {
            finalUrl = data.content.video_url.url;
          } else if (data.content?.video_url) {
            finalUrl = typeof data.content.video_url === 'string' ? data.content.video_url : data.content.video_url.url;
          } else if (data.video_url) {
            finalUrl = data.video_url;
          }

          if (finalUrl) {
            setVideoUrl(finalUrl);
          } else {
            setError('视频生成成功，但解析链接失败: ' + JSON.stringify(data));
          }
          setIsGenerating(false);
          setTaskId(null);
          clearInterval(intervalId);
        } else if (currentStatus === 'failed') {
          setError(`❌ 生成失败: ${data.error?.message || JSON.stringify(data.error)}`);
          setIsGenerating(false);
          setTaskId(null);
          clearInterval(intervalId);
        } else {
          setStatus(`⏳ 当前状态: ${currentStatus}, 10秒后再次查询...`);
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    };

    if (taskId) {
      intervalId = setInterval(pollTask, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId, apiKey]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <header className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Film size={24} className="text-blue-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Seedance 2.0 视频生成工作台</h3>
              <p className="text-sm text-zinc-400">配置你的视听语言和分镜提示词，一键呼叫底层模型。</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </header>
        
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Panel: Controls */}
          <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-zinc-800 space-y-6">
            
            {/* API Key */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                <Key size={16} className="text-yellow-500" />
                认证配置
              </h4>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">火山引擎 API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="在此粘贴你的 ARK_API_KEY..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <hr className="border-zinc-800" />

            {/* Prompt */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                <Film size={16} className="text-purple-400" />
                导演提示词 (支持 @1, @2 引用逻辑)
              </h4>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                placeholder="例如：第一人称视角果茶宣传广告...首帧为图片 @1，你的手摘下一颗带晨露的阿克苏红苹果..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Reference Images */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                <ImageIcon size={16} className="text-green-400" />
                参考素材配置
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">参考图片 @1 (URL链接)</label>
                  <input
                    type="text"
                    value={img1Url}
                    onChange={(e) => setImg1Url(e.target.value)}
                    placeholder="填写图片网络链接..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">参考图片 @2 (URL链接)</label>
                  <input
                    type="text"
                    value={img2Url}
                    onChange={(e) => setImg2Url(e.target.value)}
                    placeholder="填写图片网络链接..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Basic Params */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                <Settings2 size={16} className="text-orange-400" />
                基础参数配置
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">画面比例</label>
                  <div className="flex flex-wrap gap-2">
                    {['16:9', '9:16', '21:9', '4:3', '1:1'].map(r => (
                      <button
                        key={r}
                        onClick={() => setRatio(r)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          ratio === r 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">
                    视频时长: {duration} 秒
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="15"
                    step="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Play size={20} />
                  ✨ 开始生成视频
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Output */}
          <div className="w-full lg:w-1/2 p-6 bg-zinc-950 flex flex-col">
            <h4 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
              <Film size={16} className="text-zinc-500" />
              最终成片
            </h4>
            
            <div className="flex-1 border border-zinc-800 rounded-xl bg-black flex items-center justify-center overflow-hidden relative min-h-[300px]">
              {videoUrl ? (
                <video 
                  src={videoUrl} 
                  controls 
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-zinc-600 flex flex-col items-center gap-3">
                  {isGenerating ? (
                    <>
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                      <p className="text-sm animate-pulse">{status}</p>
                    </>
                  ) : (
                    <>
                      <Film size={48} className="opacity-20" />
                      <p className="text-sm">视频将在此处显示</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Status & Error Messages */}
            <div className="mt-4 space-y-2">
              {status && !isGenerating && !videoUrl && !error && (
                <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                  <CheckCircle2 size={16} className="text-green-500" />
                  {status}
                </div>
              )}
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="break-all">{error}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
