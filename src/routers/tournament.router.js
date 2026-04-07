import { Router } from "express";
import tournamentController from "../controllers/tournament.controller.js";
import {
	bodyValidator,
	queryValidator,
} from "../middlewares/validator.middleware.js";
import { connected } from "../middlewares/auth.middleware.js";
import {
	createTournamentValidator,
	getAllTournamentsValidator,
	registerTournamentValidator,
} from "../validators/tournament.validator.js";
import { upload } from "../middlewares/upload.middleware.js";
import { uploadImage } from "../controllers/tournament.controller.js";

const tournamentRouter = Router();

// create tournament
/**
 * @openapi
 * /tournament:
 *   post:
 *     tags:
 *       - Tournament
 *     summary: Créer un tournoi
 *     description: Permet à un administrateur de créer un nouveau tournoi.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTournamentSchema'
 *     responses:
 *       201:
 *         description: Tournoi créé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TournamentSchema'
 *       400:
 *         description: Erreur de validation des données (ex nombre de joueurs invalide, ELO invalide, date invalide).
 *       401:
 *         description: Non autorisé.
 *       403:
 *         description: Interdit - Droits administrateur requis.
 *       404:
 *         description: Catégorie(s) non trouvée(s).
 */
tournamentRouter.post(
	"/",
	connected(["admin"]),
	bodyValidator(createTournamentValidator),
	tournamentController.create,
);

// delete tournament
/**
 * @openapi
 * /tournament/{id}:
 *   delete:
 *     tags:
 *       - Tournament
 *     summary: Supprimer un tournoi
 *     description: Permet à un administrateur de supprimer un tournoi si celui-ci est en attente (waiting). Les joueurs inscrits seront désinscrits.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     responses:
 *       204:
 *         description: Tournoi supprimé avec succès.
 *       400:
 *         description: Le tournoi a déjà commencé, suppression impossible.
 *       401:
 *         description: Non autorisé.
 *       403:
 *         description: Interdit - Droits administrateur requis.
 *       404:
 *         description: Tournoi non trouvé.
 */
tournamentRouter.delete(
	"/:id",
	connected(["admin"]),
	tournamentController.delete,
);

// get all tournaments
/**
 * @openapi
 * /tournament:
 *   get:
 *     tags:
 *       - Tournament
 *     summary: Récupérer tous les tournois
 *     description: Renvoie une liste paginée avec la possibilité de filtrer par nom, lieu, dates, etc., avec des informations détaillées si l'utilisateur est connecté (comme s'il est inscrit ou s'il a le droit de s'y inscrire).
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrer par nom de tournoi.
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filtrer par lieu de tournoi.
 *       - in: query
 *         name: minElo
 *         schema:
 *           type: integer
 *         description: Filtrer par ELO minimum.
 *       - in: query
 *         name: maxElo
 *         schema:
 *           type: integer
 *         description: Filtrer par ELO maximum.
 *       - in: query
 *         name: fitElo
 *         schema:
 *           type: integer
 *         description: Filtrer par un ELO qui "rentre" (fit) dans les limites du tournoi.
 *       - in: query
 *         name: womenOnly
 *         schema:
 *           type: boolean
 *         description: Filtrer les tournois uniquement féminins.
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Tournois dont la date de fin d'inscription est supérieure ou égale à cette date.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination (nombre d'éléments à passer).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Pagination (nombre d'éléments maximum à retourner, max 100).
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, location, minElo, maxElo, endRegistrationDate, nbOfPlayers]
 *           default: endRegistrationDate
 *         description: Critère de tri.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Ordre de tri.
 *     responses:
 *       200:
 *         description: Liste des tournois récupérée.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Le nombre total de tournois.
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TournamentSchema'
 *       400:
 *         description: Erreur sur les paramètres de requête.
 */
tournamentRouter.get(
	"/",
	queryValidator(getAllTournamentsValidator),
	tournamentController.getAll,
);

// get tournament details
/**
 * @openapi
 * /tournament/{id}:
 *   get:
 *     tags:
 *       - Tournament
 *     summary: Récupérer les détails d'un tournoi
 *     description: Renvoie les informations d'un tournoi spécifique, incluant les catégories, les joueurs inscrits et les matchs avec leur statut. Inclut des données personnalisées si appelé par un utilisateur connecté.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     responses:
 *       200:
 *         description: Détails du tournoi récupérés avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TournamentSchema'
 *       404:
 *         description: Tournoi non trouvé.
 */
tournamentRouter.get("/:id", tournamentController.getById);

// register connected user to tournament
/**
 * @openapi
 * /tournament/{id}/join:
 *   post:
 *     tags:
 *       - Tournament
 *     summary: S'inscrire à un tournoi (Utilisateur connecté)
 *     description: Permet à l'utilisateur actuellement connecté de s'inscrire au tournoi spécifié, sous réserve d'éligibilité (ELO, places disponibles, délai d'inscription, catégorie, etc.).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     responses:
 *       204:
 *         description: Inscription réussie.
 *       400:
 *         description: Erreur (inscription fermée, réservé aux femmes, ELO incompatible, déjà inscrit, etc.).
 *       401:
 *         description: Non autorisé - Utilisateur non connecté.
 *       404:
 *         description: Tournoi non trouvé.
 */
tournamentRouter.post(
	"/:id/join",
	connected(),
	tournamentController.participate,
);

// register user to tournament by admin
/**
 * @openapi
 * /tournament/{id}/register:
 *   post:
 *     tags:
 *       - Tournament
 *     summary: Inscrire un joueur à un tournoi (Admin)
 *     description: Permet à un administrateur d'inscrire un joueur spécifique à un tournoi. Les mêmes règles métier (ELO, places, etc.) s'appliquent.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterTournamentSchema'
 *     responses:
 *       204:
 *         description: Inscription réussie.
 *       400:
 *         description: Erreur de validation ou règle métier non respectée.
 *       401:
 *         description: Non autorisé.
 *       403:
 *         description: Interdit - Droits administrateur requis.
 *       404:
 *         description: Tournoi ou membre non trouvé.
 */
tournamentRouter.post(
	"/:id/register",
	connected(["admin"]),
	bodyValidator(registerTournamentValidator),
	tournamentController.participate,
);

// unregister connected user from tournament
/**
 * @openapi
 * /tournament/{id}/leave:
 *   post:
 *     tags:
 *       - Tournament
 *     summary: Se désinscrire d'un tournoi (Utilisateur connecté)
 *     description: Permet à l'utilisateur actuellement connecté de se désinscrire du tournoi spécifié. Le tournoi doit être en statut "waiting".
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     responses:
 *       204:
 *         description: Désinscription réussie.
 *       400:
 *         description: Le tournoi a déjà commencé, ou le joueur n'est pas inscrit.
 *       401:
 *         description: Non autorisé - Utilisateur non connecté.
 *       404:
 *         description: Tournoi non trouvé.
 */
tournamentRouter.post(
	"/:id/leave",
	connected(),
	tournamentController.unparticipate,
);

// unregister user from tournament by admin
/**
 * @openapi
 * /tournament/{id}/unregister:
 *   post:
 *     tags:
 *       - Tournament
 *     summary: Désinscrire un joueur d'un tournoi (Admin)
 *     description: Permet à un administrateur de désinscrire un joueur spécifique d'un tournoi en attente.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterTournamentSchema'
 *     responses:
 *       204:
 *         description: Désinscription réussie.
 *       400:
 *         description: Le tournoi a déjà commencé, ou le joueur n'est pas inscrit.
 *       401:
 *         description: Non autorisé.
 *       403:
 *         description: Interdit - Droits administrateur requis.
 *       404:
 *         description: Tournoi ou membre non trouvé.
 */
tournamentRouter.post(
	"/:id/unregister",
	connected(["admin"]),
	bodyValidator(registerTournamentValidator),
	tournamentController.unparticipate,
);

// start tournament
/**
 * @openapi
 * /tournament/{id}/start:
 *   post:
 *     tags:
 *       - Tournament
 *     summary: Démarrer un tournoi
 *     description: Permet à un administrateur de démarrer un tournoi (générer les matchs). Le tournoi doit avoir le nombre minimum de joueurs requis.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     responses:
 *       204:
 *         description: Tournoi démarré avec succès.
 *       400:
 *         description: Le tournoi est déjà démarré ou n'a pas assez de joueurs.
 *       401:
 *         description: Non autorisé.
 *       403:
 *         description: Interdit - Droits administrateur requis.
 *       404:
 *         description: Tournoi non trouvé.
 */
tournamentRouter.post(
	"/:id/start",
	connected(["admin"]),
	tournamentController.start,
);

// next round
/**
 * @openapi
 * /tournament/{id}/next-round:
 *   patch:
 *     tags:
 *       - Tournament
 *     summary: Passer à la ronde suivante (Admin)
 *     description: Permet à un administrateur de passer le tournoi à la ronde suivante. Tous les matchs de la ronde courante doivent avoir un résultat.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     responses:
 *       204:
 *         description: Passage à la ronde suivante réussi.
 *       400:
 *         description: Le tournoi n'est pas démarré ou tous les matchs n'ont pas de résultat.
 *       401:
 *         description: Non autorisé.
 *       403:
 *         description: Interdit - Droits administrateur requis.
 *       404:
 *         description: Tournoi non trouvé.
 */
tournamentRouter.patch(
	"/:id/next-round",
	connected(["admin"]),
	tournamentController.nextRound,
);

// get score of a player in a tournament
/**
 * @openapi
 * /tournament/{id}/score/{playerId}:
 *   get:
 *     tags:
 *       - Tournament
 *     summary: Récupérer le score d'un joueur dans un tournoi
 *     description: Renvoie le score actuel d'un joueur spécifique dans un tournoi donné.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: L'ID du joueur.
 *     responses:
 *       200:
 *         description: Score du joueur récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PlayerScoreSchema'
 *       400:
 *         description: Le tournoi n'a pas encore commencé.
 *       404:
 *         description: Tournoi ou joueur non trouvé.
 */
tournamentRouter.get(
	"/:id/score/:playerId",
	tournamentController.scoreOfPlayer,
);

// get all players scores in a tournament
/**
 * @openapi
 * /tournament/{id}/scores:
 *   get:
 *     tags:
 *       - Tournament
 *     summary: Récupérer les scores de tous les joueurs d'un tournoi
 *     description: Renvoie la liste des scores de tous les joueurs inscrits à un tournoi donné, triée par score décroissant.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     responses:
 *       200:
 *         description: Liste des scores récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlayerScoreSchema'
 *       400:
 *         description: Le tournoi n'a pas encore commencé.
 *       404:
 *         description: Tournoi non trouvé.
 */
tournamentRouter.get("/:id/scores", tournamentController.allPlayersScores);

// get current round matches
/**
 * @openapi
 * /tournament/{id}/match/current:
 *   get:
 *     tags:
 *       - Tournament
 *     summary: Récupérer les matchs de la ronde courante
 *     description: Renvoie la liste des matchs prévus pour la ronde actuellement en cours d'un tournoi.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *     responses:
 *       200:
 *         description: Matchs de la ronde courante récupérés avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/RoundMatchesSchema'
 *         example:
 *           data:
 *             round: 1
 *             matches:
 *               - id: "d8f09d33-2e4e-409a-9a4c-4431de5d5a54"
 *                 whitePlayer:
 *                   id: "ff553b65-33c8-4346-9a32-b48aa1d8e2b2"
 *                   username: "joueur6"
 *                   gender: "M"
 *                   elo: 1100
 *                 blackPlayer:
 *                   id: "f484e2d3-e0c0-4fb2-9608-b19799428dea"
 *                   username: "joueur2"
 *                   gender: "F"
 *                   elo: 1600
 *                 result: null
 *                 round: 1
 *               - id: "703eec15-3510-44d4-b7f4-7c90d15e8163"
 *                 whitePlayer:
 *                   id: "47f42555-17c6-44f6-9e53-87a2c351e26a"
 *                   username: "joueur1"
 *                   gender: "M"
 *                   elo: 1200
 *                 blackPlayer:
 *                   id: "30a5de51-ad99-404a-b778-283d826d0de5"
 *                   username: "joueur3"
 *                   gender: "M"
 *                   elo: 1100
 *                 result: null
 *                 round: 1
 *               - id: "0555ffb3-d0b6-4f00-bd0b-6b8d3a20420d"
 *                 whitePlayer:
 *                   id: "ebc7fe71-4e99-4431-8508-5e6427830e55"
 *                   username: "joueur4"
 *                   gender: "M"
 *                   elo: 1100
 *                 blackPlayer:
 *                   id: "d59c771e-2396-4cc9-939a-0576b9307c7a"
 *                   username: "joueur5"
 *                   gender: "M"
 *                   elo: 1100
 *                 result: null
 *                 round: 1
 *       400:
 *         description: Le tournoi n'a pas encore commencé.
 *       404:
 *         description: Tournoi non trouvé.
 */
tournamentRouter.get(
	"/:id/match/current",
	tournamentController.getCurrentRoundMatches,
);

// get round matches
/**
 * @openapi
 * /tournament/{id}/round/{round}:
 *   get:
 *     tags:
 *       - Tournament
 *     summary: Récupérer les matchs d'une ronde spécifique
 *     description: Renvoie la liste des matchs prévus pour une ronde spécifique d'un tournoi donné.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID du tournoi.
 *       - in: path
 *         name: round
 *         required: true
 *         schema:
 *           type: integer
 *         description: Le numéro de la ronde.
 *     responses:
 *       200:
 *         description: Matchs de la ronde récupérés avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/RoundMatchesSchema'
 *         example:
 *           data:
 *             round: 1
 *             matches:
 *               - id: "d8f09d33-2e4e-409a-9a4c-4431de5d5a54"
 *                 whitePlayer:
 *                   id: "ff553b65-33c8-4346-9a32-b48aa1d8e2b2"
 *                   username: "joueur6"
 *                   gender: "M"
 *                   elo: 1100
 *                 blackPlayer:
 *                   id: "f484e2d3-e0c0-4fb2-9608-b19799428dea"
 *                   username: "joueur2"
 *                   gender: "F"
 *                   elo: 1600
 *                 result: null
 *                 round: 1
 *               - id: "703eec15-3510-44d4-b7f4-7c90d15e8163"
 *                 whitePlayer:
 *                   id: "47f42555-17c6-44f6-9e53-87a2c351e26a"
 *                   username: "joueur1"
 *                   gender: "M"
 *                   elo: 1200
 *                 blackPlayer:
 *                   id: "30a5de51-ad99-404a-b778-283d826d0de5"
 *                   username: "joueur3"
 *                   gender: "M"
 *                   elo: 1100
 *                 result: null
 *                 round: 1
 *               - id: "0555ffb3-d0b6-4f00-bd0b-6b8d3a20420d"
 *                 whitePlayer:
 *                   id: "ebc7fe71-4e99-4431-8508-5e6427830e55"
 *                   username: "joueur4"
 *                   gender: "M"
 *                   elo: 1100
 *                 blackPlayer:
 *                   id: "d59c771e-2396-4cc9-939a-0576b9307c7a"
 *                   username: "joueur5"
 *                   gender: "M"
 *                   elo: 1100
 *                 result: null
 *                 round: 1
 *       400:
 *         description: Le tournoi n'a pas encore commencé ou la ronde demandée n'existe pas.
 *       404:
 *         description: Tournoi non trouvé.
 */
tournamentRouter.get("/:id/round/:round", tournamentController.getRoundMatches);

// upload tournament image
tournamentRouter.patch(
	"/:id/image",
	connected(["admin"]),
	upload.single("image"),
	uploadImage,
);

export default tournamentRouter;
