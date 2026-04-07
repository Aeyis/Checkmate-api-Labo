console.clear();
// Charge les variables d'environnement du fichier .env dans process.env
import "dotenv/config";

import cors from "cors";

// Importation du framework Express pour créer le serveur web
import express from "express";
// Importation de Morgan, un middleware de "logging" pour voir les requêtes HTTP dans la console
import morgan from "morgan";

// Importation de Swagger pour la documentation de l'API
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

// Importation du gestionnaire d'erreurs personnalisé (centralise la gestion des erreurs)
import { errorHandler } from "./middlewares/error.middleware.js";

// Importation de l'instance de la base de données (généralement Sequelize)
import db from "./database/index.js";
// Importation du routeur principal qui regroupe toutes les routes de l'API
import router from "./routers/index.js";
// Importation d'un middleware de sécurité pour vérifier l'identité de l'utilisateur (JWT, session, etc.)
import { authentification } from "./middlewares/auth.middleware.js";
import { swaggerOptions } from "./config/swagger.config.js";
import tournamentService from "./services/tournament.service.js";

// Extraction du port défini dans le fichier .env (ex: 3000)
const { APP_PORT } = process.env;

// Vérifie la connexion à la base de données de manière asynchrone
await db.sequelize.authenticate();

// TODO enlever quand on passe en PROD!!!
// Synchronise les modèles avec la base de données (modifie les tables existantes pour correspondre au code)
await db.sequelize.sync({ alter: true });

// Initialisation de l'application Express
const app = express();

// ajout du middleware cors "cross origin sharing"
// sécurité qui valide l'api auprès du navigateur
app.use(cors({
	origin: "*",
}));

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Route pour la documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Sert les fichiers statiques (images, CSS, JS client) contenus dans le dossier "public"
app.use(express.static("public"));

// Permet de lire les données envoyées via des formulaires HTML (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));
// Permet de lire les données envoyées au format JSON (très courant pour les API)
app.use(express.json());

// Active le log des requêtes en mode "dev" (affiche la méthode, l'URL, le statut et le temps de réponse)
app.use(morgan("dev"));

// Applique le middleware d'authentification à TOUTES les routes qui suivent
app.use(authentification);

// Branchement des routes principales de l'application
app.use(router);

// Middleware de gestion d'erreurs (doit toujours être placé en dernier après les routes)
app.use(errorHandler);

// Lance le serveur sur le port spécifié et affiche un message de confirmation
app.listen(APP_PORT, () => {
	console.log(`Web API available at http://localhost:${APP_PORT}`);
	console.log(`Documentation available at http://localhost:${APP_PORT}/docs`);
});

// Vérifie toutes les 60 secondes si des tournois en attente ont dépassé
// leur date de fin d'inscription, et les démarre automatiquement.
setInterval(async () => {
	const tournaments = await db.Tournament.findAll({
		where: { status: "waiting" },
	});

	for (const tournament of tournaments) {
		if (new Date(tournament.endRegistrationDate) <= new Date()) {
			try {
				await tournamentService.start(tournament.id);
				console.log(
					`Tournament ${tournament.id} a démarré.`,
				);
			} catch (e) {
				console.warn(
					`Tournament ${tournament.id} ne peut pas démarrer: ${e.message}`,
				);
			}
		}
	}
}, 60_000); // toutes les 60 secondes