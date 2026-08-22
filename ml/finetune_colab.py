# ============================================================
#  Aetheria 2099 — 소형 모델 파인튜닝 (Colab 무료 T4)
#
#  Qwen2.5-7B-Instruct 를 QLoRA(4bit)로 파인튜닝해, Claude를 증류한
#  train.jsonl(멀티턴 포함)을 학습시킨다. 학습 후 GGUF(q5_k_m)로 내보내 Ollama 구동.
#
#  ★ Unsloth의 save_pretrained_gguf는 fp16 원본에 LoRA를 병합 후 GGUF 양자화 —
#    즉 단일 양자화(올바름). (MLX 로컬 경로의 이중 양자화 문제 없음.)
#
#  사용법: Colab 새 노트북 → 런타임을 T4 GPU로 → 아래 셀들을 순서대로.
#  (# %% 는 셀 구분.)
# ============================================================

# %% [셀 1] Unsloth 설치
# !pip install -q "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
# !pip install -q --no-deps trl peft accelerate bitsandbytes

# %% [셀 2] Drive 마운트 (저장 유실 방지 — 어댑터/GGUF를 Drive에 안전 보관)
from google.colab import drive
drive.mount("/content/drive")
SAVE_DIR = "/content/drive/MyDrive/aetheria-model"
import os
os.makedirs(SAVE_DIR, exist_ok=True)
print("저장 경로:", SAVE_DIR)

# %% [셀 3] 데이터셋 업로드
# 로컬에서 만든 ml/train.jsonl 을 업로드한다(멀티턴 포함 확장본).
# ※ 평가용 ml/eval.jsonl(홀드아웃 40개)은 학습에 넣지 않는다 — 학습 후
#    로컬 Ollama에서 eval.mjs로 그 40개를 돌려 정직한 baseline을 잰다.
from google.colab import files
up = files.upload()  # train.jsonl 선택
DATA_PATH = "train.jsonl"

# %% [셀 4] 베이스 모델 로드 (Qwen2.5-7B, 4bit)
from unsloth import FastLanguageModel
import torch

MAX_SEQ = 3072  # 멀티턴 예제는 문맥 포함 ~2k토큰
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-7B-Instruct-bnb-4bit",
    max_seq_length=MAX_SEQ,
    load_in_4bit=True,     # QLoRA: 4bit로 올려 T4(16GB)에 맞춤
    dtype=None,
)

# %% [셀 5] LoRA 어댑터 부착 — rank 32로 표현력↑ (문장 품질 레버)
model = FastLanguageModel.get_peft_model(
    model,
    r=32,                 # 16→32: 표현력↑(문장력·일관성). T4에서 여전히 여유.
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    use_gradient_checkpointing="unsloth",
    random_state=42,
)

# %% [셀 6] 데이터 로드 + 채팅 템플릿 적용 (Qwen = ChatML)
from datasets import load_dataset
from unsloth.chat_templates import get_chat_template

tokenizer = get_chat_template(tokenizer, chat_template="qwen-2.5")
ds = load_dataset("json", data_files=DATA_PATH, split="train")

def fmt(ex):
    text = tokenizer.apply_chat_template(ex["messages"], tokenize=False, add_generation_prompt=False)
    return {"text": text}

ds = ds.map(fmt)
print("예제 수:", len(ds))
print(ds[0]["text"][:600])

# %% [셀 7] 학습 (SFT) — assistant 응답만 손실(train_on_responses_only), 3 에폭
from trl import SFTTrainer, SFTConfig
from unsloth.chat_templates import train_on_responses_only

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=ds,
    args=SFTConfig(
        dataset_text_field="text",
        max_seq_length=MAX_SEQ,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,   # 유효 배치 8
        warmup_steps=15,
        num_train_epochs=3,              # 데이터↑ → 3 에폭으로 형식·문법 안정화
        learning_rate=2e-4,
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=42,
        output_dir="outputs",
    ),
)
trainer = train_on_responses_only(
    trainer,
    instruction_part="<|im_start|>user\n",
    response_part="<|im_start|>assistant\n",
)
trainer.train()

# %% [셀 8] ★어댑터 먼저 Drive에 저장 + 검증 (긴 GGUF 전에 유실 방지)
ADAPTER_DIR = os.path.join(SAVE_DIR, "adapter")
model.save_pretrained(ADAPTER_DIR)
tokenizer.save_pretrained(ADAPTER_DIR)
_saved = os.path.join(ADAPTER_DIR, "adapter_model.safetensors")
assert os.path.exists(_saved) and os.path.getsize(_saved) > 1_000_000, "어댑터 저장 실패!"
print("✅ 어댑터 Drive 저장 검증 완료:", round(os.path.getsize(_saved) / 1e6, 1), "MB")

# %% [셀 9] 빠른 확인 — 학습된 모델이 JSON을 뱉는지
FastLanguageModel.for_inference(model)
sample = ds[0]["messages"][:2]  # system+user만
prompt = tokenizer.apply_chat_template(sample, tokenize=False, add_generation_prompt=True)
inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
out = model.generate(**inputs, max_new_tokens=512, temperature=0.65, do_sample=True)
print(tokenizer.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True))

# %% [셀 10] GGUF 내보내기 (q5_k_m — q4보다 문장 노이즈↓, ~5.4GB) + Drive 저장·검증
model.save_pretrained_gguf("aetheria-gguf", tokenizer, quantization_method="q5_k_m")
import glob, shutil
_gguf = sorted(glob.glob("aetheria-gguf/*.gguf"))
assert _gguf, "GGUF 생성 실패!"
_dst = os.path.join(SAVE_DIR, os.path.basename(_gguf[0]))
shutil.copy(_gguf[0], _dst)
assert os.path.exists(_dst) and os.path.getsize(_dst) > 1_000_000_000, "GGUF Drive 저장 실패!"
print("✅ GGUF Drive 저장 검증 완료:", _dst, round(os.path.getsize(_dst) / 1e6, 1), "MB")
# 로컬로 받으려면: from google.colab import files; files.download(_gguf[0])
