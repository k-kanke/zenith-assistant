package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2/google"
)

type GeminiRequest struct {
	Message string `json:"message"`
}

func GeminiRouteHandler(c *gin.Context) {
	// _ = godotenv.Load()

	var req GeminiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	currrentYear := time.Now().Year()
	now := time.Now().Format("2006-01-02 15:04:05 (Monday)")

	prompt := fmt.Sprintf(`現在は %d 年です。現在日時： %s
	次の日本語の文章から、以下の形式でユーザーの意図と必要情報を抽出してください。

必ず以下の intent 候補から1つを選んでください：
- "free_slot_request"：空き時間を取得したい
- "schedule_register"：予定を登録したい（ただし確認・編集前提）
- "schedule_register_direct"：命令形（「登録しておいて」など）で、そのまま即登録可能なもの
- "unknown"：どれにも当てはまらない場合

"start_time", "end_time": 空き時間を検索する時間の範囲を設定してください。例えば、「14時以降で空き時間はありますか」という質問に対しては
"start_time": "14:00"
"end_time": null
「15時から20時の間で空き時間ありますか？」という質問に対しては、
"start_time": "15:00"
"end_time": "20:00"
と設定してください。

必ず intent をそのまま文字列で返してください。出力は以下の形式でJSONオブジェクトとしてください：

出力形式（JSON）:
{
  "intent": "...",
  "emails": [...],          // メールアドレスの配列
  "date": "YYYY-MM-DD",     // 日付
  "start_time": "HH:MM",    // 開始時刻（任意）
  "end_time": "HH:MM",    // 終了時刻（任意）
  "duration": "...",        // 所要時間（任意）
  "title": "..."            // タイトル（任意）
}

ユーザーの入力:
%s
`, currrentYear, now, req.Message)

	// log.Println("[Prompt]:", prompt)

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"role": "user",
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
	}

	jsonBody, _ := json.Marshal(requestBody)

	// apiKey := os.Getenv("GEMINI_API_KEY")

	// Vertex AI 用のアクセストークンを取得
	ctx := context.Background()
	creds, err := google.FindDefaultCredentials(ctx, "https://www.googleapis.com/auth/cloud-platform")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get credentials"})
		return
	}

	tokenSource := creds.TokenSource
	token, err := tokenSource.Token()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get token"})
		return
	}

	//endpoint := "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=" + apiKey

	// Vertex AI endpoint
	endpoint := "https://asia-northeast1-aiplatform.googleapis.com/v1/projects/" + creds.ProjectID + "/locations/asia-northeast1/publishers/google/models/gemini-1.5-pro:generateContent"

	reqHttp, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "request build failed"})
		return
	}
	reqHttp.Header.Set("Authorization", "Bearer "+token.AccessToken)
	reqHttp.Header.Set("Content-Type", "application/json")

	{ /*
			resp, err := http.Post(endpoint, "application/json", bytes.NewBuffer(jsonBody))
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to contact Gemini API"})
				return
			}
			defer resp.Body.Close()

			log.Println("[resp]:", resp)
		*/
	}

	resp, err := http.DefaultClient.Do(reqHttp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "API call failed"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(body, &result)

	text := extractText(result)
	log.Println("[text]:", text)

	jsonStart := strings.Index(text, "{")
	jsonEnd := strings.LastIndex(text, "}")
	if jsonStart == -1 || jsonEnd == -1 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid response from Gemini"})
		return
	}

	parsedJSON := text[jsonStart : jsonEnd+1]
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(parsedJSON), &parsed); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse JSON from Gemini response"})
		return
	}

	log.Println("[parsedJSON]:", parsedJSON)

	c.JSON(http.StatusOK, parsed)
}

func extractText(res map[string]interface{}) string {
	candidates, ok := res["candidates"].([]interface{})
	if !ok || len(candidates) == 0 {
		return ""
	}
	candidate := candidates[0].(map[string]interface{})
	content := candidate["content"].(map[string]interface{})
	parts := content["parts"].([]interface{})
	part := parts[0].(map[string]interface{})
	return part["text"].(string)
}
