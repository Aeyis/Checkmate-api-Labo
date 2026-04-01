import { Router } from "express";
import {
	bodyValidator,
	paramValidator,
	queryValidator,
} from "../middlewares/validator.middleware.js";
import {
	getAllValidator,
	getByIdValidator,
	registerValidator,
	updateValidator,
} from "../validators/member.validator.js";
import memberController from "../controllers/member.controller.js";
import { connected } from "../middlewares/auth.middleware.js";

const memberRouter = Router();

/**
 * @openapi
 * /member:
 *   post:
 *     tags:
 *       - Member
 *     summary: Inscription d'un nouveau membre
 *     description: Permet à un administrateur d'inscrire un nouveau membre (joueur).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterMemberSchema'
 *     responses:
 *       204:
 *         description: Succès - Le membre a été créé avec succès. Aucune donnée n'est renvoyée.
 *       400:
 *         description: Erreur de validation - Données invalides, email ou nom d'utilisateur déjà existant.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseSchema'
 *       401:
 *         description: Non autorisé - L'utilisateur n'est pas connecté ou le token est invalide.
 *       403:
 *         description: Interdit - L'utilisateur n'a pas les droits nécessaires (admin requis).
 *       500:
 *         description: Erreur serveur interne.
 */
memberRouter.post(
	"/",
	connected(["admin"]),
	bodyValidator(registerValidator),
	memberController.register,
);

/**
 * @openapi
 * /member:
 *   get:
 *     tags:
 *       - Member
 *     summary: Récupérer tous les membres
 *     description: Permet à un administrateur de récupérer tous les membres.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UsernameFilterParam'
 *       - $ref: '#/components/parameters/EmailFilterParam'
 *       - $ref: '#/components/parameters/BirthdateFilterParam'
 *       - $ref: '#/components/parameters/GenderFilterParam'
 *       - $ref: '#/components/parameters/EloFilterParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *     responses:
 *       200:
 *         description: Succès - Les membres ont été récupérés avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MemberListingSchema'
 *       401:
 *         description: Non autorisé - L'utilisateur n'est pas connecté ou le token est invalide.
 *       403:
 *         description: Interdit - L'utilisateur n'a pas les droits nécessaires (admin requis).
 *       500:
 *         description: Erreur serveur interne.
 */
memberRouter.get(
	"/",
	connected(["admin"]),
	queryValidator(getAllValidator),
	memberController.getAll,
);

/**
 * @openapi
 * /member/me:
 *   get:
 *     tags:
 *       - Member
 *     summary: Récupérer le membre connecté
 *     description: Permet à un membre connecté de récupérer ses propres informations.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Succès - Le membre a été récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MemberSchema'
 *       401:
 *         description: Non autorisé - L'utilisateur n'est pas connecté ou le token est invalide.
 *       500:
 *         description: Erreur serveur interne.
 */
memberRouter.get("/me", connected(), memberController.getConsumer);

/**
 * @openapi
 * /member/{id}:
 *   get:
 *     tags:
 *       - Member
 *     summary: Récupérer un membre par son ID
 *     description: Permet à un membre connecté de récupérer les informations d'un membre par son ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'ID du membre à récupérer.
 *     responses:
 *       200:
 *         description: Succès - Le membre a été récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MemberSchema'
 *       401:
 *         description: Non autorisé - L'utilisateur n'est pas connecté ou le token est invalide.
 *       404:
 *         description: Non trouvé - Le membre avec l'ID spécifié n'a pas été trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseSchema'
 *       500:
 *         description: Erreur serveur interne.
 */
memberRouter.get(
	"/:id",
	connected(),
	paramValidator(getByIdValidator),
	memberController.getById,
);

/**
 * @openapi
 * /member/me:
 *   put:
 *     tags:
 *       - Member
 *     summary: Mettre à jour un membre connecté
 *     description: Permet à un membre connecté de mettre à jour ses propres informations.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMemberSchema'
 *     responses:
 *       200:
 *         description: Succès - Le membre a été mis à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MemberSchema'
 *       401:
 *         description: Non autorisé - L'utilisateur n'est pas connecté ou le token est invalide.
 *       500:
 *         description: Erreur serveur interne.
 */
memberRouter.put(
	"/me",
	connected(),
	bodyValidator(updateValidator),
	memberController.updateConsumer,
);

/**
 * @openapi
 * /member/{id}:
 *   put:
 *     tags:
 *       - Member
 *     summary: Mettre à jour un membre par son ID
 *     description: Permet à un membre connecté de mettre à jour les informations d'un membre par son ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'ID du membre à mettre à jour.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMemberSchema'
 *     responses:
 *       200:
 *         description: Succès - Le membre a été mis à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MemberSchema'
 *       401:
 *         description: Non autorisé - L'utilisateur n'est pas connecté ou le token est invalide.
 *       404:
 *         description: Non trouvé - Le membre avec l'ID spécifié n'a pas été trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseSchema'
 *       500:
 *         description: Erreur serveur interne.
 */
memberRouter.put(
	"/:id",
	connected(),
	paramValidator(getByIdValidator),
	bodyValidator(updateValidator),
	memberController.updateById,
);

memberRouter.delete(
	'/:id',
	connected(["admin"]),
	memberController.delete,
);

export default memberRouter;
