# ============================================================
#  Aetheria 2099 — 소형 모델 파인튜닝 (Colab 무료 T4)
#
#  Qwen2.5-3B-Instruct 를 QLoRA(4bit)로 파인튜닝해, Gemini를 증류한
#  dataset.jsonl 을 학습시킨다. 학습 후 GGUF로 내보내 Ollama에서 구동.
#
#  사용법: Colab 새 노트북 → 런타임을 T4 GPU로 → 아래 셀들을 순서대로.
#  (# %% 는 셀 구분. Colab에서 각 블록을 별도 셀로 붙여넣으면 된다.)
# ============================================================

# %% [셀 1] Unsloth 설치 (T4에서 QLoRA를 빠르게)
# !pip install -q "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
# !pip install -q --no-deps trl peft accelerate bitsandbytes

# %% [셀 2] 데이터셋 업로드
# 로컬에서 만든 ml/dataset.jsonl 을 Colab에 업로드한다.
from google.colab import files
up = files.upload()  # dataset.jsonl 선택
DATA_PATH = "dataset.jsonl"

# %% [셀 3] 베이스 모델 로드 (Qwen2.5-3B, 4bit) — 한국어+JSON에 강한 소형 모델
from unsloth import FastLanguageModel
import torch

MAX_SEQ = 4096  # 우리 예제는 앵커 포함 ~2k토큰이라 4096이면 충분
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-3B-Instruct-bnb-4bit",
    max_seq_length=MAX_SEQ,
    load_in_4bit=True,     # QLoRA: 4bit로 올려 T4(16GB)에 맞춤
    dtype=None,
)

# %% [셀 4] LoRA 어댑터 부착 — 전체가 아니라 작은 어댑터만 학습(가볍고 빠름)
model = FastLanguageModel.get_peft_model(
    model,
    r=16,                 # LoRA rank. 16~32. 크면 표현력↑ 메모리↑
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    use_gradient_checkpointing="unsloth",  # 메모리 절약
    random_state=42,
)

# %% [셀 5] 데이터 로드 + 채팅 템플릿 적용 (Qwen = ChatML)
from datasets import load_dataset
from unsloth.chat_templates import get_chat_template

tokenizer = get_chat_template(tokenizer, chat_template="qwen-2.5")

ds = load_dataset("json", data_files=DATA_PATH, split="train")

def fmt(ex):
    # messages(system/user/assistant) → 하나의 학습 텍스트로
    text = tokenizer.apply_chat_template(ex["messages"], tokenize=False, add_generation_prompt=False)
    return {"text": text}

ds = ds.map(fmt)
print("예제 수:", len(ds))
print(ds[0]["text"][:600])

# %% [셀 6] 학습 (SFT) — assistant 응답만 손실 계산(train_on_responses_only)
from trl import SFTTrainer, SFTConfig
from unsloth.chat_templates import train_on_responses_only

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=ds,
    dataset_text_field="text",
    max_seq_length=MAX_SEQ,
    args=SFTConfig(
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,   # 유효 배치 8
        warmup_steps=10,
        num_train_epochs=2,              # 데이터 적으면 2~3
        learning_rate=2e-4,
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=42,
        output_dir="outputs",
    ),
)
# 프롬프트(system/user)는 손실에서 제외, assistant JSON만 학습
trainer = train_on_responses_only(
    trainer,
    instruction_part="<|im_start|>user\n",
    response_part="<|im_start|>assistant\n",
)
trainer.train()

# %% [셀 7] 빠른 확인 — 학습된 모델이 JSON을 뱉는지
FastLanguageModel.for_inference(model)
sample = ds[0]["messages"][:2]  # system+user만
prompt = tokenizer.apply_chat_template(sample, tokenize=False, add_generation_prompt=True)
inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
out = model.generate(**inputs, max_new_tokens=512, temperature=0.9, do_sample=True)
print(tokenizer.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True))

# %% [셀 8] GGUF로 내보내기 (Ollama에서 구동용). q4_k_m = 균형 잡힌 양자화
model.save_pretrained_gguf("aetheria-qwen3b", tokenizer, quantization_method="q4_k_m")
# → aetheria-qwen3b/ 에 .gguf 생성. Colab 파일에서 다운로드하거나 HF에 업로드.
# from google.colab import files; files.download("aetheria-qwen3b/unsloth.Q4_K_M.gguf")
