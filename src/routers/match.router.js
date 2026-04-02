import { Router } from "express";
import matchController from "../controllers/match.controller.js";
import { connected } from "../middlewares/auth.middleware.js";
import { bodyValidator } from "../middlewares/validator.middleware.js";
import { setResultValidator } from "../validators/match.validator.js";

const matchRouter = Router();

/**
 * @openapi
 * /match/{matchId}/result:
 *   patch:
 *     tags:
 *       - Match
 *     summary: Enregistrer le résultat d'un match
 *     description: Permet à un administrateur d'enregistrer ou de modifier le résultat d'un match spécifique (victoire blanche, victoire noire ou match nul). Le tournoi doit être en cours.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: L'identifiant (ID) du match.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetResultSchema'
 *     responses:
 *       204:
 *         description: Succès - Le résultat du match a été mis à jour avec succès. Aucune donnée n'est renvoyée.
 *       400:
 *         description: Erreur de validation - Tournoi non démarré, résultat invalide, etc.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseSchema'
 *       401:
 *         description: Non autorisé - L'utilisateur n'est pas connecté ou le token est invalide.
 *       403:
 *         description: Interdit - L'utilisateur n'a pas les droits nécessaires (admin requis).
 *       404:
 *         description: Non trouvé - Le match avec l'ID spécifié n'existe pas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseSchema'
 *       500:
 *         description: Erreur serveur interne.
 */
matchRouter.patch(
	"/:matchId/result",
	connected(["admin"]),
	bodyValidator(setResultValidator),
	matchController.setResult,
);
matchRouter.get("/me", connected(), matchController.getMyMatches);

export default matchRouter;
