import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { DIRECTOR_PROMPT, ART_PROMPT, STORYBOARD_PROMPT, STYLE_SPELLS } from "../config/prompts";

// Initialize the Google Gen AI client lazily
let aiClient: GoogleGenAI | null = null;

export function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please check your environment configuration.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Use the Pro model for complex reasoning and JSON generation
const PRO_MODEL = "gemini-3.1-pro-preview";
const FLASH_MODEL = "gemini-3-flash-preview";

/**
 * 辅助函数：清理 Markdown 标记并解析 JSON
 * 解决大模型有时会在 JSON 外面包裹 ```json 和 ``` 标记的问题，以及处理控制字符等
 */
function cleanAndParseJSON(responseText: string) {
  if (!responseText || !responseText.trim()) {
    throw new Error("大模型返回了空文本，无法解析为 JSON。");
  }

  // 辅助函数：尝试解析并修复常见的 JSON 错误
  const tryParse = (str: string) => {
    try {
      // 尝试修复常见的 JSON 错误（如尾随逗号、控制字符）
      const fixed = str
        .replace(/,\s*([}\]])/g, '$1') 
        .replace(/[\u0000-\u001F]+/g, ' ');
      return JSON.parse(fixed.trim());
    } catch (e) {
      return null;
    }
  };

  // 1. 尝试直接解析（最理想情况）
  const direct = tryParse(responseText);
  if (direct) return direct;

  // 2. 尝试从 Markdown 代码块中提取
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch && jsonMatch[1]) {
    const fromMarkdown = tryParse(jsonMatch[1]);
    if (fromMarkdown) return fromMarkdown;
  }

  // 3. 尝试寻找第一个 { 或 [ 并找到匹配的结束符
  const firstBrace = responseText.indexOf('{');
  const firstBracket = responseText.indexOf('[');
  
  let start = -1;
  let opener = '';
  let closer = '';

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    opener = '{';
    closer = '}';
  } else if (firstBracket !== -1) {
    start = firstBracket;
    opener = '[';
    closer = ']';
  }

  if (start !== -1) {
    // 寻找匹配的结束符
    let count = 0;
    let end = -1;
    let inString = false;
    let escape = false;

    for (let i = start; i < responseText.length; i++) {
      const char = responseText[i];
      
      if (escape) {
        escape = false;
        continue;
      }
      
      if (char === '\\') {
        escape = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === opener) {
          count++;
        } else if (char === closer) {
          count--;
          if (count === 0) {
            end = i + 1;
            break;
          }
        }
      }
    }

    if (end !== -1) {
      const extracted = responseText.substring(start, end);
      const fromExtracted = tryParse(extracted);
      if (fromExtracted) return fromExtracted;
    }
    
    // 如果匹配失败，退而求其次：寻找最后一个结束符
    const lastCloser = responseText.lastIndexOf(closer);
    if (lastCloser > start) {
      const extracted = responseText.substring(start, lastCloser + 1);
      const fromLastCloser = tryParse(extracted);
      if (fromLastCloser) return fromLastCloser;
    }
  }

  console.error("JSON 解析彻底失败，原始文本:", responseText);
  throw new Error("在返回的文本中找不到有效的 JSON 结构。");
}

/**
 * 辅助函数：检查 API 响应是否有效（处理安全拦截等情况）
 */
function validateResponse(response: any, stageName: string) {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error(`${stageName} 失败：API 返回了空的结果，可能是由于安全策略拦截。`);
  }
  
  const candidate = response.candidates[0];
  if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
    throw new Error(`${stageName} 失败：API 生成异常中断，原因: ${candidate.finishReason}`);
  }
  
  if (!response.text) {
    throw new Error(`${stageName} 失败：API 返回了空的文本内容。`);
  }
}

/**
 * 辅助函数：判断是否为频率限制或配额错误 (429 / RESOURCE_EXHAUSTED)
 */
/**
 * 判断是否为可重试的错误（如频率限制、服务器临时错误、RPC 失败等）
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const errorString = typeof error === 'object' ? JSON.stringify(error) : String(error);
  const errorMessage = (error.message || (error.error && error.error.message) || errorString).toLowerCase();
  const errorStatus = error.status || (error.error && error.error.status);
  const errorCode = error.code || error.errorCode || (error.error && error.error.code);
  
  // 如果是硬性配额耗尽，不应重试
  if (errorMessage.includes('exceeded your current quota') || errorMessage.includes('billing details') || errorMessage.includes('quota exceeded')) {
    return false;
  }

  // 1. 频率限制错误 (429)
  const isRateLimit = (
    errorStatus === 429 || 
    errorCode === 429 ||
    errorStatus === 'RESOURCE_EXHAUSTED' ||
    errorMessage.includes('429') || 
    errorMessage.includes('resource_exhausted') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests')
  );

  // 2. 服务器临时错误或 RPC 失败 (500/503/504 或特定 RPC 消息)
  const isServerTransientError = (
    errorCode === 500 ||
    errorCode === 503 ||
    errorCode === 504 ||
    errorMessage.includes('rpc failed') ||
    errorMessage.includes('xhr error') ||
    errorMessage.includes('internal error') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('deadline exceeded')
  );
  
  return isRateLimit || isServerTransientError;
}

/**
 * 提取用户友好的错误信息
 */
function getFriendlyErrorMessage(error: any): string {
  const errorString = typeof error === 'object' ? JSON.stringify(error) : String(error);
  const errorMessage = (error.message || (error.error && error.error.message) || errorString).toLowerCase();
  
  if (errorMessage.includes('exceeded your current quota') || errorMessage.includes('billing details') || errorMessage.includes('quota exceeded')) {
    return "API 配额已耗尽（长文消耗较大），请检查您的 Google Cloud 计费计划或稍后再试。";
  }
  if (errorMessage.includes('rpc failed') || errorMessage.includes('xhr error')) {
    return "网络请求失败 (RPC/XHR Error)，请检查网络连接或稍后重试。";
  }
  if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return "请求过于频繁，触发了 API 频率限制，请稍后再试。";
  }
  
  return error.message || (error.error && error.error.message) || errorString;
}

/**
 * 辅助函数：带指数退避的重试机制
 */
async function fetchWithRetry<T>(apiCall: () => Promise<T>, maxRetries = 2, initialDelay = 1000): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (isRetryableError(error)) {
        if (retries >= maxRetries) {
          throw error; // 抛出错误，由外层 fallback 处理
        }
        const delay = initialDelay * Math.pow(2, retries);
        console.warn(`[API Retry] 触发可重试错误，${delay}ms 后进行第 ${retries + 1} 次重试... 错误详情:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error; 
      }
    }
  }
}

/**
 * 核心调用函数：支持模型降级
 */
async function callGeminiWithFallback(
  systemInstruction: string,
  contents: string,
  stageName: string,
  isJson: boolean = true,
  modelOverride?: string,
  signal?: AbortSignal,
  enableThinking: boolean = false
) {
  const ai = getAIClient();
  const modelToUse = modelOverride || PRO_MODEL;
  const apiCall = (model: string) => ai.models.generateContent({
    model: model,
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      ...(isJson ? { responseMimeType: "application/json" } : {}),
      ...(enableThinking && model.includes('gemini-3') ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : {}),
    },
  });

  try {
    // Check if already aborted
    if (signal?.aborted) throw new Error("Task cancelled by user");

    // 1. 尝试使用指定的模型（或默认 Pro 模型）
    const response = await fetchWithRetry(() => {
      if (signal?.aborted) throw new Error("Task cancelled by user");
      return apiCall(modelToUse);
    });
    validateResponse(response, stageName);
    return response;
  } catch (error: any) {
    if (error.message === "Task cancelled by user") throw error;
    console.error(`[API Error] ${stageName} 原始错误:`, error);

    if (isRetryableError(error) && modelToUse !== FLASH_MODEL) {
      console.warn(`[API Fallback] ${modelToUse} 模型触发可重试错误或超限，正在自动切换至 Flash 模型 (${FLASH_MODEL}) 进行处理...`);
      // 2. 降级使用 Flash 模型，Flash 模型通常有更高的配额
      try {
        if (signal?.aborted) throw new Error("Task cancelled by user");
        const response = await fetchWithRetry(() => {
          if (signal?.aborted) throw new Error("Task cancelled by user");
          return apiCall(FLASH_MODEL);
        });
        validateResponse(response, stageName);
        return response;
      } catch (flashError: any) {
        if (flashError.message === "Task cancelled by user") throw flashError;
        console.error(`[API Fallback Error] Flash 模型也失败了:`, flashError);
        throw new Error(getFriendlyErrorMessage(flashError));
      }
    }
    throw new Error(getFriendlyErrorMessage(error));
  }
}

/**
 * 将长文本按段落拆分为多个块，以避免超出输出 Token 限制
 */
function splitTextIntoChunks(text: string, maxChunkLength: number = 1500): string[] {
  // 1. 尝试按双换行符拆分（段落）
  let paragraphs = text.split(/\n\n+/);
  
  // 如果某一段落过长，则尝试按单换行符拆分
  let refinedParagraphs: string[] = [];
  for (const p of paragraphs) {
    if (p.length > maxChunkLength) {
      refinedParagraphs.push(...p.split(/\n/));
    } else {
      refinedParagraphs.push(p);
    }
  }

  const chunks: string[] = [];
  let currentChunk = "";

  for (const p of refinedParagraphs) {
    if ((currentChunk.length + p.length) > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += p + "\n\n";
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

export async function analyzeImagesForScene(imagesBase64: string[]): Promise<{ cn: string, en: string }> {
  try {
    const ai = getAIClient();
    
    const prompt = `
Please analyze these reference images and describe the environment, lighting, character appearance, and clothing in detail to form a cohesive scene prompt for image generation.
Do NOT include any camera angles or shot types, just the scene and subjects.

Output strictly in JSON format:
{
  "cn": "中文场景描述...",
  "en": "English scene description..."
}
`;

    const parts: any[] = imagesBase64.map(img => {
      // Extract base64 data and mime type
      const match = img.match(/^data:(.+);base64,(.*)$/);
      if (match) {
        return {
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        };
      }
      return null;
    }).filter(Boolean);

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      cn: result.cn || "",
      en: result.en || ""
    };
  } catch (error) {
    console.error("Vision API Error:", error);
    throw error;
  }
}

/**
 * 运行导演分析：解析剧本中的角色和场景

 * @param scriptText 剧本内容
 * @param options 分析维度配置
 * @returns 解析后的 JSON 对象
 */
export async function runDirectorAnalysis(
  scriptText: string, 
  options?: any, 
  onProgress?: (node: number, text: string) => void, 
  preferredModel: string = "auto",
  signal?: AbortSignal
) {
  try {
    console.log(`=== [API Request] Director Analysis Pipeline Started (Model: ${preferredModel}) ===`);
    
    // 动态构建指令，根据用户选择的功能维度进行强调
    let systemInstruction = DIRECTOR_PROMPT;
    if (options) {
      const { genre, style, aspectRatio, ...modules } = options;
      const enabledModules = Object.entries(modules)
        .filter(([_, v]) => v)
        .map(([k]) => {
          const mapping: any = {
            causalLoop: "机制 1：因果闭环与物理动作缝合",
            entityConcretization: "机制 2：实体绝对具象化",
            propAndPersonTracking: "机制 3：道具与人员的存在性追踪",
            safetySubstitution: "机制 4：视听平替与安全合规",
            spatialAnchoring: "机制 5：空间层级绑定与物理锚点锁定",
            rhetoricStripping: "机制 6：修辞剥离与情绪肌肉化直译",
            microExpression: "机制 7：微表情与全情绪肌肉化映射法则"
          };
          return mapping[k] || k;
        })
        .join('、');
      
      systemInstruction += `\n\n【剧本基础设定】\n- 题材：${genre || '未指定'}\n- 视觉风格：${style || '未指定'}\n- 画面比例：${aspectRatio || '9:16'}\n\n【当前任务重点】\n用户已在控制中心启用了以下核心机制：[${enabledModules}]。请在分析过程中给予这些维度最高优先级的关注，并在诊断报告中详细体现。同时，请确保所有润色和建议都符合上述【剧本基础设定】。`;
    }

    // 确定初始模型
    const initialModel = preferredModel === "auto" ? PRO_MODEL : preferredModel;

    // 切片模式：直接将剧本分块，每块独立进行完整的导演分析
    const chunks = splitTextIntoChunks(scriptText, 1500);
    
    let aggregatedDiagnosticReport = "";
    let aggregatedFixingStrategy = "";
    let finalAiReadyScript: string[] = [];
    let lastThoughts = "";

    for (let i = 0; i < chunks.length; i++) {
      if (signal?.aborted) throw new Error("Task cancelled by user");
      
      if (onProgress) onProgress(i + 1, `🎬 剧本切片分析中 (处理中 ${i + 1}/${chunks.length})...`);
      
      const chunkPrompt = `【当前场景切片 (${i+1}/${chunks.length})】\n请严格按照系统指令中的【四大核心清洗机制】对以下剧本切片进行深度清洗和重构。输出必须严格遵循 JSON 格式。\n\n【剧本切片正文】\n${chunks[i]}`;
      
      const chunkResponse = await callGeminiWithFallback(systemInstruction, chunkPrompt, `切片分析-${i+1}`, true, initialModel, signal, true);
      const chunkParsed = cleanAndParseJSON(chunkResponse.text || "");
      
      if (chunkParsed) {
        if (chunkParsed.diagnosticReport) {
          aggregatedDiagnosticReport += `\n\n--- 切片 ${i+1} 诊断 ---\n${chunkParsed.diagnosticReport}`;
        }
        if (chunkParsed.fixingStrategy) {
          aggregatedFixingStrategy += `\n\n--- 切片 ${i+1} 状态封存 ---\n${chunkParsed.fixingStrategy}`;
        }
        if (chunkParsed.thoughts) {
          lastThoughts = chunkParsed.thoughts;
        }
        
        if (Array.isArray(chunkParsed.aiReadyScript)) {
          finalAiReadyScript.push(...chunkParsed.aiReadyScript);
        } else if (typeof chunkParsed.aiReadyScript === 'string') {
          finalAiReadyScript.push(chunkParsed.aiReadyScript);
        }
      }
    }
    
    console.log("=== Director Analysis Slice Processing Completed ===");

    return {
      thoughts: lastThoughts,
      diagnosticReport: aggregatedDiagnosticReport.trim(),
      fixingStrategy: aggregatedFixingStrategy.trim(),
      aiReadyScript: finalAiReadyScript.join('\n\n')
    };
  } catch (error) {
    console.error("Director Analysis Error:", error);
    throw error;
  }
}

/**
 * 运行美术设计：根据导演分析结果生成视觉资产描述
 * @param directorJsonData 导演分析的 JSON 结果
 * @param preferredModel 偏好模型
 * @param signal 中断信号
 * @param scriptSettings 剧本设定
 * @returns 包含分镜画面描述的 JSON 对象
 */
export async function runArtDesign(
  directorJsonData: any, 
  preferredModel: string = "auto", 
  signal?: AbortSignal,
  scriptSettings?: any
) {
  try {
    if (signal?.aborted) throw new Error("Task cancelled by user");

    // If directorJsonData is a string (raw script) or doesn't have aiReadyScript, wrap it
    let payloadObj = directorJsonData;
    if (typeof directorJsonData === 'string') {
      payloadObj = { aiReadyScript: directorJsonData };
    } else if (directorJsonData && !directorJsonData.aiReadyScript && directorJsonData.content) {
      // Handle case where it might be a script object
      payloadObj = { aiReadyScript: directorJsonData.content };
    }
    
    let systemInstruction = ART_PROMPT;
    if (scriptSettings) {
      const styleSpell = scriptSettings.style && STYLE_SPELLS[scriptSettings.style] 
        ? STYLE_SPELLS[scriptSettings.style] 
        : scriptSettings.style || '未指定';

      systemInstruction += `\n\n【剧本基础设定】\n- 题材：${scriptSettings.genre || '未指定'}\n- 视觉风格：${scriptSettings.style || '未指定'}\n- 画面比例：${scriptSettings.aspectRatio || '9:16'}\n\n【技术参数：强制画风锁定】\n当前选定的画风咒语为：“${styleSpell}”。\n请在生成所有资产的 prompt 结尾，死死焊上这串画风词，确保所有视觉资产的画风绝对统一。`;
    }

    const payload = JSON.stringify(payloadObj);
    const modelToUse = preferredModel === "auto" ? PRO_MODEL : preferredModel;
    console.log(`=== [API Request] Art Design Payload (Model: ${modelToUse}) ===`, payload);
    const response = await callGeminiWithFallback(systemInstruction, payload, "美术设计", true, modelToUse, signal, true);
    
    console.log("=== [API Response] Art Design Raw Text ===", response.text);
    return cleanAndParseJSON(response.text || "");
  } catch (error) {
    console.error("Art Design Error:", error);
    throw error;
  }
}

/**
 * 运行分镜编写：根据美术设计结果和剧本生成最终的分镜表
 * @param artJsonData 美术设计的 JSON 结果
 * @param scriptContent 润色后的剧本内容
 * @param preferredModel 偏好模型
 * @param signal 中断信号
 * @param scriptSettings 剧本设定
 * @returns 最终的分镜表 JSON 对象
 */
export async function runStoryboarding(
  artJsonData: any, 
  scriptContent: string, 
  preferredModel: string = "auto", 
  signal?: AbortSignal,
  scriptSettings?: any
) {
  try {
    if (signal?.aborted) throw new Error("Task cancelled by user");

    let systemInstruction = STORYBOARD_PROMPT;
    if (scriptSettings) {
      const styleSpell = scriptSettings.style && STYLE_SPELLS[scriptSettings.style] 
        ? STYLE_SPELLS[scriptSettings.style] 
        : scriptSettings.style || '未指定';

      systemInstruction += `\n\n【剧本基础设定】\n- 题材：${scriptSettings.genre || '未指定'}\n- 视觉风格：${scriptSettings.style || '未指定'}\n- 画面比例：${scriptSettings.aspectRatio || '9:16'}\n\n【技术参数：强制画风锁定】\n当前选定的画风咒语为：“${styleSpell}”。\n请在生成每个镜头的描述结尾，死死焊上这串画风词，确保所有分镜的画风绝对统一。`;
    }

    const payload = JSON.stringify({
      assets: artJsonData || { characters: [], environments: [], props: [], spatialPositioning: "" },
      script: scriptContent
    });
    const modelToUse = preferredModel === "auto" ? PRO_MODEL : preferredModel;
    console.log(`=== [API Request] Storyboarding Payload (Model: ${modelToUse}) ===`, payload);
    
    // For Gemini 3 models, we enable thinking to get better reasoning and detail
    const response = await callGeminiWithFallback(systemInstruction, payload, "分镜编写", true, modelToUse, signal, true);
    
    console.log("=== [API Response] Storyboarding Raw Text ===", response.text);
    return cleanAndParseJSON(response.text || "");
  } catch (error) {
    console.error("Storyboarding Error:", error);
    throw error;
  }
}
