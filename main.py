import asyncio
from openai import AsyncOpenAI
import lorem

import requests



# OpenAI 비동기 클라이언트 초기화
client = AsyncOpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

# 비동기 작업 함수
async def my_func(i):

    url = "https://zenquotes.io/api/random"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()[0]
        # print(f"{data['q']} — {data['a']}")
    else:
        # print("Error:", response.status_code)
        pass

    print(f"작업 {i} 시작")
    response = await client.responses.create(
        model="Qwen/Qwen3-30B-A3B-Instruct-2507-FP8",
        input=f'''{data['q']}
1. 한국어로 번역하라.
2. 이 명언을 남긴 사람을 찾아라.
3. 그 사람에 대해 알려줘라.'''
    )
    result = response.output[0].content[0].text
    print(f"작업 {i} 완료: {result}")
    print("-"*100)
    return result

async def main():
    # 10개의 요청을 동시에 실행
    tasks = [asyncio.create_task(my_func(i)) for i in range(1)]
    results = await asyncio.gather(*tasks)
    print("모든 작업 완료:", results)

if __name__ == "__main__":
    asyncio.run(main())
