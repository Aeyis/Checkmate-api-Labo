// Importation de la bibliothèque jsonwebtoken pour gérer la création et la vérification des tokens
import jwt from "jsonwebtoken";

// Extraction de la clé secrète depuis les variables d'environnement (indispensable pour signer le token)
const { JWT_SECRET, JWT_EXPIRATION } = process.env;

/**
 * Génère un nouveau token JWT pour un utilisateur donné.
 * @param {Object} user - L'objet utilisateur issu de la base de données
 */
export const generateToken = user => {
	// Définition des données publiques embarquées dans le token (ne jamais mettre de mot de passe ici !)
	const payload = {
		id: user.id,
		role: user.role,
		gender: user.gender,
	};

	// Création du token signé
	const token = jwt.sign(payload, JWT_SECRET, {
		// Définit la durée de validité du token (ici 2 heures : 60s * 60m * 2)
		expiresIn: +JWT_EXPIRATION,
	});

	return token;
};

/**
 * Vérifie l'authenticité d'un token et extrait les données (payload) qu'il contient.
 * @param {string} token - Le token envoyé par le client
 */
export const decodeToken = token => {
	// Vérifie la signature avec la clé secrète.
	// Si le token est expiré ou falsifié, cette fonction lève une erreur.
	return jwt.verify(token, JWT_SECRET);
};
