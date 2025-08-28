import compromise from "compromise";
import Sentiment from "sentiment";

export interface TextAnalysisResult {
  basic: {
    characterCount: number;
    characterCountNoSpaces: number;
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    averageWordsPerSentence: number;
    averageCharactersPerWord: number;
  };
  linguistic: {
    sentiment: {
      score: number;
      comparative: number;
      classification: "positive" | "negative" | "neutral";
      positive: string[];
      negative: string[];
    };
    readability: {
      fleschKincaidGrade: number;
      fleschReadingEase: number;
      difficulty:
        | "very easy"
        | "easy"
        | "fairly easy"
        | "standard"
        | "fairly difficult"
        | "difficult"
        | "very difficult";
    };
    keywords: string[];
    entities: {
      people: string[];
      places: string[];
      organizations: string[];
    };
  };
  advanced: {
    languageDetection: string;
    textComplexity: number;
    uniqueWords: number;
    lexicalDiversity: number;
    mostFrequentWords: Array<{ word: string; count: number }>;
  };
}

export interface QueueResponse {
  queueId: string;
  message: string;
  estimatedTime: number;
  textSize: number;
}

export class TextAnalysisService {
  private sentiment = new Sentiment();
  private cache = new Map<string, any>();
  private readonly CACHE_SIZE = 100;
  private readonly DIRECT_PROCESSING_LIMIT = 25000; // 25KB - processamento direto
  private readonly QUEUE_LIMIT = 50000; // 50KB - limite máximo

  async analyzeText(text: string): Promise<TextAnalysisResult | QueueResponse> {
    const textSize = text.length;

    // 🔴 Textos muito grandes: rejeitados
    if (textSize > this.QUEUE_LIMIT) {
      throw new Error(
        `Texto muito longo. Máximo permitido: ${this.QUEUE_LIMIT / 1000}KB`
      );
    }

    // 🟡 Textos médios: vão para fila
    if (textSize > this.DIRECT_PROCESSING_LIMIT) {
      return this.addToQueue(text);
    }

    // 🟢 Textos pequenos: processamento direto
    return this.analyzeTextDirectly(text);
  }

  private async analyzeTextDirectly(text: string): Promise<TextAnalysisResult> {
    const startTime = Date.now();

    // Verificar cache primeiro
    const cacheKey = this.generateCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Análises básicas (otimizadas para processamento direto)
      const basic = this.getBasicAnalysis(text);

      // Análises linguísticas (otimizadas)
      const linguistic = await this.getLinguisticAnalysis(text);

      // Análises avançadas (completas para textos pequenos)
      const advanced = this.getAdvancedAnalysis(text);

      const processingTime = Date.now() - startTime;

      const result = {
        basic,
        linguistic,
        advanced,
        metadata: {
          processingTime,
          analyzedAt: new Date().toISOString(),
          processingType: "direct",
        },
      } as any;

      // Armazenar no cache
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error("Erro na análise direta de texto:", error);
      throw new Error("Falha ao analisar o texto diretamente");
    }
  }

  private addToQueue(text: string): QueueResponse {
    const textSize = text.length;
    const estimatedTime = this.calculateEstimatedTime(textSize);

    // Gerar ID único para a fila
    const queueId = this.generateQueueId();

    // TODO: Implementar lógica real da fila (Bull/Redis)
    // Por enquanto, retornamos resposta simulada

    return {
      queueId,
      message: `Texto enviado para processamento em fila. Tamanho: ${(textSize / 1000).toFixed(1)}KB`,
      estimatedTime,
      textSize,
    };
  }

  private calculateEstimatedTime(textSize: number): number {
    // Estimativa baseada no tamanho do texto
    // Textos de 25-50KB: 30 segundos a 2 minutos
    const baseTime = 30; // 30 segundos base
    const timePerKB = 2; // 2 segundos por KB adicional

    return Math.min(baseTime + (textSize / 1000) * timePerKB, 120); // Máximo 2 minutos
  }

  private generateQueueId(): string {
    // Gerar ID único para identificação na fila
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `queue_${timestamp}_${random}`;
  }

  private generateCacheKey(text: string): string {
    // Criar hash simples para o texto
    let hash = 0;
    const str = text.substring(0, 100); // Usar apenas os primeiros 100 caracteres
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private setCache(key: string, value: any): void {
    // Limpar cache se estiver muito grande
    if (this.cache.size >= this.CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  private getBasicAnalysis(text: string) {
    const characterCount = text.length;
    const characterCountNoSpaces = text.replace(/\s/g, "").length;

    // Otimização: usar regex mais eficiente
    const words = text.match(/\b\w+\b/g) || [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      characterCount,
      characterCountNoSpaces,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence:
        sentences.length > 0
          ? Math.round((words.length / sentences.length) * 100) / 100
          : 0,
      averageCharactersPerWord:
        words.length > 0
          ? Math.round((characterCountNoSpaces / words.length) * 100) / 100
          : 0,
    };
  }

  private async getLinguisticAnalysis(text: string) {
    // Análise de sentimento (mais eficiente)
    const sentimentResult = this.sentiment.analyze(text);
    const sentimentClassification = this.classifySentiment(
      sentimentResult.comparative
    );

    // Análise de legibilidade (otimizada)
    const readability = this.calculateReadability(text);

    // Extração de palavras-chave (limitada para textos longos)
    const keywords =
      text.length > 5000
        ? this.extractBasicKeywords(text)
        : this.extractKeywords(text);

    // Extração de entidades (limitada para textos longos)
    const entities =
      text.length > 5000
        ? this.extractBasicEntities(text)
        : this.extractEntities(text);

    return {
      sentiment: {
        score: sentimentResult.score,
        comparative: Math.round(sentimentResult.comparative * 1000) / 1000,
        classification: sentimentClassification,
        positive: sentimentResult.positive.slice(0, 10), // Limitar a 10 palavras
        negative: sentimentResult.negative.slice(0, 10), // Limitar a 10 palavras
      },
      readability,
      keywords,
      entities,
    };
  }

  private getBasicAdvancedAnalysis(text: string) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);

    return {
      languageDetection: this.detectLanguage(text),
      textComplexity: this.calculateBasicTextComplexity(text),
      uniqueWords: uniqueWords.size,
      lexicalDiversity:
        words.length > 0
          ? Math.round((uniqueWords.size / words.length) * 10000) / 10000
          : 0,
      mostFrequentWords: this.getBasicWordFrequency(words).slice(0, 5), // Apenas top 5
    };
  }

  private getAdvancedAnalysis(text: string) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    const wordFrequency = this.getWordFrequency(words);

    return {
      languageDetection: this.detectLanguage(text),
      textComplexity: this.calculateTextComplexity(text),
      uniqueWords: uniqueWords.size,
      lexicalDiversity:
        words.length > 0
          ? Math.round((uniqueWords.size / words.length) * 10000) / 10000
          : 0,
      mostFrequentWords: wordFrequency.slice(0, 10),
    };
  }

  private classifySentiment(
    comparative: number
  ): "positive" | "negative" | "neutral" {
    if (comparative > 0.1) return "positive";
    if (comparative < -0.1) return "negative";
    return "neutral";
  }

  private calculateReadability(text: string) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.match(/\b\w+\b/g) || [];

    if (sentences.length === 0 || words.length === 0) {
      return {
        fleschKincaidGrade: 0,
        fleschReadingEase: 0,
        difficulty: "standard" as const,
      };
    }

    const syllables = words.reduce(
      (total, word) => total + this.countSyllables(word),
      0
    );

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade =
      0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

    // Flesch Reading Ease
    const fleschReadingEase =
      206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    return {
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 100) / 100,
      fleschReadingEase: Math.round(fleschReadingEase * 100) / 100,
      difficulty: this.classifyReadingDifficulty(fleschReadingEase),
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = word.match(/[aeiouy]+/g);
    let syllableCount = vowels ? vowels.length : 1;

    if (word.endsWith("e")) syllableCount--;
    if (syllableCount === 0) syllableCount = 1;

    return syllableCount;
  }

  private classifyReadingDifficulty(score: number) {
    if (score >= 90) return "very easy";
    if (score >= 80) return "easy";
    if (score >= 70) return "fairly easy";
    if (score >= 60) return "standard";
    if (score >= 50) return "fairly difficult";
    if (score >= 30) return "difficult";
    return "very difficult";
  }

  private extractBasicKeywords(text: string): string[] {
    // Versão simplificada para textos longos
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const stopWords = new Set([
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "had",
      "o",
      "a",
      "e",
      "é",
      "de",
      "do",
      "da",
      "em",
      "um",
      "uma",
      "para",
      "com",
      "não",
      "que",
      "se",
      "na",
      "por",
      "mais",
      "como",
      "mas",
      "foi",
      "ao",
      "ele",
      "das",
      "tem",
      "à",
      "seu",
      "sua",
      "ou",
      "ser",
      "quando",
      "muito",
      "há",
      "nos",
      "já",
      "está",
      "eu",
      "também",
      "só",
      "pelo",
      "pela",
      "até",
      "isso",
      "ela",
      "entre",
      "era",
      "depois",
      "sem",
      "mesmo",
      "aos",
      "ter",
      "seus",
      "suas",
      "numa",
      "pelos",
      "pelas",
      "esse",
      "eles",
      "essa",
      "num",
      "nem",
      "suas",
      "meu",
      "às",
      "minha",
      "têm",
      "numa",
      "pelos",
      "pelas",
      "essas",
      "esses",
      "pelas",
      "esta",
      "estes",
      "estas",
      "aquele",
      "aquela",
      "aqueles",
      "aquelas",
      "isto",
      "aquilo",
    ]);

    const keywords = words.filter(word => !stopWords.has(word)).slice(0, 10); // Limitar a 10 palavras-chave

    return [...new Set(keywords)]; // Remover duplicatas
  }

  private extractKeywords(text: string): string[] {
    try {
      const doc = compromise(text);
      const nouns = doc.nouns().out("array");
      const adjectives = doc.adjectives().out("array");

      const keywords = [...nouns, ...adjectives]
        .filter(word => word.length > 3)
        .map(word => word.toLowerCase())
        .filter((word, index, arr) => arr.indexOf(word) === index)
        .slice(0, 15);

      return keywords;
    } catch {
      // Fallback para versão básica se compromise falhar
      return this.extractBasicKeywords(text);
    }
  }

  private extractBasicEntities(_text: string): any {
    // Versão simplificada para textos longos
    return {
      people: [],
      places: [],
      organizations: [],
    };
  }

  private extractEntities(text: string) {
    try {
      const doc = compromise(text);

      return {
        people: doc.people().out("array").slice(0, 10),
        places: doc.places().out("array").slice(0, 10),
        organizations: doc.organizations().out("array").slice(0, 10),
      };
    } catch {
      // Fallback para versão básica se compromise falhar
      return this.extractBasicEntities(text);
    }
  }

  private detectLanguage(text: string): string {
    // Implementação simples de detecção de idioma
    const portugueseWords = [
      "que",
      "não",
      "uma",
      "para",
      "com",
      "mais",
      "como",
      "mas",
      "foi",
      "pelo",
    ];
    const englishWords = [
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "had",
    ];
    const spanishWords = [
      "que",
      "para",
      "con",
      "por",
      "como",
      "pero",
      "más",
      "una",
      "los",
      "del",
    ];

    const words = text.toLowerCase().split(/\s+/);

    const ptCount = words.filter(word => portugueseWords.includes(word)).length;
    const enCount = words.filter(word => englishWords.includes(word)).length;
    const esCount = words.filter(word => spanishWords.includes(word)).length;

    if (ptCount > enCount && ptCount > esCount) return "pt";
    if (enCount > esCount) return "en";
    if (esCount > 0) return "es";

    return "unknown";
  }

  private calculateBasicTextComplexity(text: string): number {
    const words = text.match(/\b\w+\b/g) || [];
    if (words.length === 0) return 0;

    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;
    return Math.round(avgWordLength * 10) / 10;
  }

  private calculateTextComplexity(text: string): number {
    const words = text.match(/\b\w+\b/g) || [];
    if (words.length === 0) return 0;

    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const longWords = words.filter(word => word.length > 6).length;
    const longWordRatio = longWords / words.length;

    // Complexidade baseada no tamanho médio das palavras e proporção de palavras longas
    return Math.round((avgWordLength * 0.5 + longWordRatio * 10) * 100) / 100;
  }

  private getBasicWordFrequency(
    words: string[]
  ): Array<{ word: string; count: number }> {
    const frequency: { [key: string]: number } = {};
    const stopWords = new Set([
      "a",
      "an",
      "and",
      "are",
      "as",
      "at",
      "be",
      "by",
      "for",
      "from",
      "has",
      "he",
      "in",
      "is",
      "it",
      "its",
      "of",
      "on",
      "that",
      "the",
      "to",
      "was",
      "will",
      "with",
      "o",
      "a",
      "e",
      "é",
      "de",
      "do",
      "da",
      "em",
      "um",
      "uma",
      "para",
      "com",
      "não",
      "que",
      "se",
      "na",
      "por",
      "mais",
      "como",
      "mas",
      "foi",
      "ao",
      "ele",
      "das",
      "tem",
      "à",
      "seu",
      "sua",
      "ou",
      "ser",
      "quando",
      "muito",
      "há",
      "nos",
      "já",
      "está",
      "eu",
      "também",
      "só",
      "pelo",
      "pela",
      "até",
      "isso",
      "ela",
      "entre",
      "era",
      "depois",
      "sem",
      "mesmo",
      "aos",
      "ter",
      "seus",
      "suas",
      "numa",
      "pelos",
      "pelas",
      "esse",
      "eles",
      "essa",
      "num",
      "nem",
      "suas",
      "meu",
      "às",
      "minha",
      "têm",
      "numa",
      "pelos",
      "pelas",
      "essas",
      "esses",
      "pelas",
      "esta",
      "estes",
      "estas",
      "aquele",
      "aquela",
      "aqueles",
      "aquelas",
      "isto",
      "aquilo",
    ]);

    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
      if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
        frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getWordFrequency(
    words: string[]
  ): Array<{ word: string; count: number }> {
    return this.getBasicWordFrequency(words);
  }

  // Método para limpar cache e liberar memória
  public clearCache(): void {
    this.cache.clear();
  }
}
