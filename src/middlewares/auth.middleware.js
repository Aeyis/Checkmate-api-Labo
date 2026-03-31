// Importation de la fonction de vérification créée précédemment
import { decodeToken } from "../utils/jwt.utils.js";

/**
 * Middleware d'authentification globale.
 * Son rôle : Extraire le token et identifier l'utilisateur S'IL est présent.
 */
export const authentification = (req, res, next) => {
	// Récupération du header "Authorization" (ex: "Bearer eyJhbG...")
	const bearerToken = req.headers["authorization"];
	console.log(bearerToken);
	if (bearerToken) {
		// Découpe la chaîne pour séparer le mot "Bearer" du "token" lui-même
		const [bearer, token] = bearerToken.split(" ");

		// Vérifie que le format commence bien par "Bearer" (insensible à la casse)
		if (bearer.toLowerCase() !== "bearer") {
			res.status(403).send(); // Interdit si le format du header est mauvais
			return;
		}

		try {
			// Tentative de décodage et vérification de la signature du token
			const decoded = decodeToken(token);
			console.log(decoded); // Affiche le payload (id, role) dans la console

			// Sauvegarde les infos de l'utilisateur directement dans l'objet "req"
			// Cela permet aux routes suivantes d'accéder à req.user.id ou req.user.role
			req.user = {
				id: decoded.id,
				role: decoded.role,
			};
		} catch (err) {
			// Si le token est expiré ou invalide, on renvoie une erreur 401 (Non autorisé)
			res.status(401).send();
			return;
		}
	}

	// On passe au middleware suivant (même si aucun token n'était présent)
	next();
};

/**
 * Middleware de restriction d'accès (Autorisation).
 * @param {string[]} onlyForRoles - Tableau des rôles autorisés (ex: ["admin", "editor"])
 */
export const connected = onlyForRoles => {
	return (req, res, next) => {
		// Si l'utilisateur n'est pas identifié (pas de req.user), accès refusé
		if (!req.user) {
			res.status(401).send();
			return;
		}

		// Si une liste de rôles spécifiques est fournie pour cette route
		if (onlyForRoles) {
			const userRole = req.user.role;

			// Vérifie si le rôle de l'utilisateur est inclus dans la liste autorisée
			if (!onlyForRoles.includes(userRole)) {
				res.status(403).send(); // 403 Forbidden : identifié mais pas les droits
				return;
			}
		}

		// L'utilisateur est connecté et a le bon rôle, on continue
		next();
	};
};
