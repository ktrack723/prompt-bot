import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  const { currentCount } = await req.json();    // 클라이언트에서 전달
  // 1) 프롬프트 작성
  const prompt = `
You are a game design assistant that OUTPUTS ONLY JSON.
Generate ONE character object with:
- name, faction, rank
- traits: array(min 3)
- dialogue: array(min 5)
Return nothing else.
`;

  // 2) GPT 호출
  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",          // 요금↓ 빠름
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  // 3) JSON 파싱 & 유효성 검사
  const data = JSON.parse(chat.choices[0].message.content);
  if (data.traits?.length < 3 || data.dialogue?.length < 5) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  // 4) Supabase 저장
  const { error } = await supabase.from("characters").insert([data]);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, character: data });
}