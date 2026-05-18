export const API_BASE_URL = "YOUR_API_BASE_URL";
export const API_KEY = "YOUR_API_KEY";

/**
 * 1. 提交视频生成任务
 */
export async function submitDreaminaVideo(prompt: string, imageUrl: string | null = null) {
  // 根据是否传入了参考图片，自动选择文生视频或图生视频的接口预设
  const endpoint = imageUrl ? "/api/dreamina/image2video" : "/api/dreamina/text2video";
  const payload = imageUrl ? { prompt, image_url: imageUrl } : { prompt };

  console.log("[即梦 API] 模拟提交任务:", payload);
  // TODO: 后续替换为真实的 fetch 调用
  /*
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.task_id; // 假设平台返回 task_id
  */
  
  // 假装返回一个 taskId 进行后续链路测试
  return "mock_task_12345";
}

/**
 * 2. 查询任务状态
 */
export async function queryDreaminaStatus(taskId: string) {
  console.log(`[即梦 API] 查询任务状态: ${taskId}`);
  // TODO: 后续替换为真实的 fetch 轮询逻辑
  /*
  const res = await fetch(`${API_BASE_URL}/api/dreamina/query?task_id=${taskId}`, {
    headers: { "Authorization": `Bearer ${API_KEY}` }
  });
  return await res.json();
  */

  // 模拟等待机制：随机返回处理中或成功状态
  const isDone = Math.random() > 0.7; // 30% 概率完成
  return {
    status: isDone ? "success" : "processing",
    video_url: isDone ? "https://www.w3schools.com/html/mov_bbb.mp4" : null, // 用开源视频做占位
    fail_reason: null
  };
}

/**
 * 3. 组合接口：提交并轮询直到完成（节点端直接调用此方法）
 */
export async function generateDreaminaVideoAndWait(prompt: string, imageUrl: string | null, onProgress: (status: string) => void) {
  try {
    // 第一步：提交任务
    const taskId = await submitDreaminaVideo(prompt, imageUrl);
    if (onProgress) onProgress("submitted");

    // 第二步：一直轮询，直到即梦后台渲染完成
    while (true) {
      // 视频渲染很慢，每隔 5 秒查询一次即可
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const res = await queryDreaminaStatus(taskId);
      
      if (res.status === "success" || res.status === "completed") {
        return res.video_url; // 成功，跳出循环返回视频 URL
      } else if (res.status === "failed" || res.status === "error") {
        throw new Error(res.fail_reason || "即梦后台生成失败");
      } else {
        // queue, pending, processing...
        if (onProgress) onProgress("processing");
      }
    }
  } catch (error) {
    console.error("[即梦 API] 视频生成断开:", error);
    throw error;
  }
}
