import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("Missing OpenAI API key");
}

const openai = new OpenAI({ apiKey });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  await req.json();
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
const content = chat.choices[0].message.content;
if (!content) {
  return NextResponse.json({ error: "Empty response from OpenAI" }, { status: 500 });
}

const data = JSON.parse(content);
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