import { Request, Response, NextFunction } from 'express';
import { AiCrossQuestionService, GenerateQuestionInput, EvaluateAnswerInput } from '../services/aiCrossQuestionService';

export class CrossQuestionController {
  /**
   * POST /generate-question & POST /api/generate-question
   * Generates a targeted, challenging Socratic question exposing unsupported claims,
   * contradictions, weak evidence, assumptions, fallacies, or inconsistencies.
   */
  static async generateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        topic,
        playerArgument,
        opponentArgument,
        previousArguments = [],
        round = 1,
      } = req.body;

      if (!topic && !playerArgument) {
        res.status(400).json({
          error: 'Missing required field: "topic" or "playerArgument" must be provided.',
        });
        return;
      }

      const input: GenerateQuestionInput = {
        topic: topic || 'Competitive Debate Motion',
        playerArgument: playerArgument || '',
        opponentArgument: opponentArgument || '',
        previousArguments: Array.isArray(previousArguments) ? previousArguments : [],
        round: Number(round) || 1,
      };

      const result = await AiCrossQuestionService.generateQuestion(input);

      // Return exact required schema matching user prompt specification
      res.status(200).json({
        question: result.question,
        targetPlayer: result.targetPlayer,
        reason: result.reason,
        difficulty: result.difficulty,
        // Additional metadata
        vulnerabilityType: result.vulnerabilityType,
        round: input.round,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /evaluate-cross-answer & POST /api/evaluate-cross-answer
   * Evaluates how effectively the player answered the AI-generated cross-question.
   */
  static async evaluateAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        topic,
        question,
        questionReason,
        answer,
        targetPlayer = 'A',
        round = 1,
      } = req.body;

      if (!answer) {
        res.status(400).json({
          error: 'Missing required field: "answer" must be provided.',
        });
        return;
      }

      const input: EvaluateAnswerInput = {
        topic: topic || 'Debate Motion',
        question: question || 'Explain your premise under cross-examination.',
        questionReason,
        answer,
        targetPlayer: targetPlayer === 'B' ? 'B' : 'A',
        round: Number(round) || 1,
      };

      const result = await AiCrossQuestionService.evaluateAnswer(input);

      res.status(200).json({
        score: result.score,
        grade: result.grade,
        passed: result.passed,
        breakdown: result.breakdown,
        vulnerabilityAddressed: result.vulnerabilityAddressed,
        feedback: result.feedback,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        targetPlayer: input.targetPlayer,
        round: input.round,
        evaluatedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
