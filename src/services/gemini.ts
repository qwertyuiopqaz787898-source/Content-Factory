import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateIdeas(topic: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `أنت خبير في إنشاء محتوى يوتيوب ناجح. قناتي تتحدث عن "كيف تصنع الأشياء" في المصانع العملاقة، خصوصاً للعلامات التجارية الكبرى.
أعطني 5 أفكار عناوين جذابة جداً (Clickbait ولكن صادقة) لفيديو عن: ${topic}.
يجب أن تكون العناوين باللغة العربية، وتثير الفضول.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "قائمة من 5 عناوين جذابة للفيديو",
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse ideas JSON", e);
    return [];
  }
}

export async function generateScript(idea: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `أنت كاتب سيناريو محترف لقنوات اليوتيوب الوثائقية والترفيهية، ومتخصص في أسلوب السرد القصصي المشوق (Storytelling) اللي بيخلي المشاهد ميكملش الفيديو للآخر بس، ده كمان ينسى نفسه وهو بيتفرج.

اكتب لي سكربت كامل وتفصيلي جداً لفيديو يوتيوب بعنوان: "${idea}".

**شروط السكربت:**
1. **اللهجة:** العامية المصرية البسيطة والمشوقة (زي قنوات الدحيح، العشوائي، أو قنوات الصناعة المشهورة).
2. **التنسيق للمعلق الصوتي (Voice Over):**
   - السكربت لازم يكون مكتوب كأنه "نص جاهز للتسجيل" فوراً.
   - قسم الكلام لجمل قصيرة ومتوسطة.
   - استخدم علامات الوقف بوضوح:
     - (وقفة قصيرة) أو (...) للتشويق.
     - (وقفة طويلة) قبل المعلومات الصادمة.
     - (بنبرة حماسية)، (بنبرة هادية)، (باستغراب) لتوجيه المعلق.
3. **هيكل الفيديو:**
   - **المقدمة (Hook):** أول 15 ثانية لازم تكون قنبلة! ابدأ بسؤال صادم، أو حقيقة غريبة، أو مشهد مستحيل تتخيله عشان نمسك المشاهد من أول لحظة.
   - **القصة والمحتوى (Body):** اشرح خطوات الصناعة في المصانع العملاقة بالتفصيل الممل بس بطريقة حكاية مشوقة. اتكلم عن حجم المكن، سرعة الإنتاج، الأرقام المرعبة، والسر اللي الشركة بتخبيه.
   - **الذروة (Climax):** خلي فيه لحظة في النص هي الأهم والأكثر تعقيداً في الصناعة.
   - **الخاتمة (Outro):** اقفل بحاجة تخلي المشاهد يفكر، واطلب منه الاشتراك واللايك بطريقة ذكية مش تقليدية، واسأله سؤال يخليه يكتب كومنت.
4. **الملاحظات البصرية (Visual Cues):** حط بين قوسين مربعة [ ] وصف دقيق للي المفروض يظهر على الشاشة في اللحظة دي (مثال: [لقطة سريعة لتروس بتلف بسرعة جنونية]، [زوم إن على وش العامل]، [مؤثر صوتي: خبطة حديد]).

السكربت لازم يكون طويل، تفصيلي، مليان حيوية، وجاهز يدخل كابينة التسجيل فوراً!`,
  });
  return response.text || "";
}

export async function generateThumbnailPrompt(idea: string, script: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `بناءً على عنوان الفيديو: "${idea}" والسكربت التالي:
${script.substring(0, 500)}...

اكتب لي وصفاً دقيقاً (Prompt) باللغة الإنجليزية لإنشاء صورة مصغرة (Thumbnail) جذابة جداً لهذا الفيديو باستخدام الذكاء الاصطناعي.
الصورة يجب أن تكون بأسلوب يوتيوب (ألوان زاهية، تباين عالي، عنصر ضخم أو آلة عملاقة، ربما شخص متفاجئ).
الوصف يجب أن يكون باللغة الإنجليزية فقط ومناسباً لمولد صور مثل Imagen أو Midjourney.`,
  });
  return response.text || "";
}

export async function generateThumbnailImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        {
          text: prompt + " YouTube thumbnail style, high contrast, vibrant colors, highly detailed, 8k resolution, cinematic lighting.",
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("لم يتم العثور على صورة في الرد.");
}

export async function generateAssets(idea: string, script: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `بناءً على عنوان الفيديو: "${idea}" والسكربت الخاص به.
أعطني قائمة بملحقات المونتاج (Editing Assets) التي سأحتاجها لإنتاج هذا الفيديو بشكل احترافي.
قسّمها إلى:
1. لقطات B-Roll مقترحة (مثال: لقطات درون لمصنع، لقطات ماكرو لتروس).
2. مؤثرات صوتية (SFX) مقترحة (مثال: صوت آلة ضخمة، صوت Whoosh للانتقالات).
3. نوع الموسيقى الخلفية المناسبة لكل جزء من الفيديو.
4. أفكار للمؤثرات البصرية (VFX) أو الجرافيكس (Motion Graphics).
اكتب الرد باللغة العربية وبتنسيق Markdown.`,
  });
  return response.text || "";
}

export async function generateMetadata(idea: string, script: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `بناءً على عنوان الفيديو: "${idea}" والسكربت الخاص به.
أعطني البيانات الوصفية (Metadata) التالية لرفع الفيديو على يوتيوب وتحقيق أفضل SEO:
1. عنوان الفيديو (Title) - يمكنك تحسين العنوان الأصلي إذا لزم الأمر.
2. وصف الفيديو (Description) - فقرة جذابة مع روابط افتراضية لحسابات التواصل.
3. الكلمات المفتاحية (Tags) - قائمة بـ 15-20 كلمة مفتاحية قوية مفصولة بفواصل.
4. الهاشتاجات (Hashtags) - 3 إلى 5 هاشتاجات قوية.
اكتب الرد باللغة العربية وبتنسيق Markdown.`,
  });
  return response.text || "";
}
