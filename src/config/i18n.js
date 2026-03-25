const i18next = require('i18next');
const middleware = require('i18next-http-middleware');

/**
 * i18n Configuration
 * Handles multilingual support
 */

const resources = {
  en: {
    translation: {
      // Auth messages
      'auth.register_success': 'User registration successful',
      'auth.login_success': 'Login successful',
      'auth.invalid_credentials': 'Invalid email or password',
      'auth.user_exists': 'User with this email already exists',
      'auth.password_changed': 'Password changed successfully',
      'auth.unauthorized': 'Unauthorized access',
      
      // Event messages
      'event.created': 'Event created successfully',
      'event.updated': 'Event updated successfully',
      'event.deleted': 'Event deleted successfully',
      'event.not_found': 'Event not found',
      'event.at_capacity': 'Event is at full capacity',
      'event.registered': 'Successfully registered for the event',
      'event.unregistered': 'Successfully unregistered from the event',
      'event.already_registered': 'Already registered for this event',
      
      // Review messages
      'review.created': 'Review submitted successfully',
      'review.updated': 'Review updated successfully',
      'review.deleted': 'Review deleted successfully',
      'review.must_attend': 'You must be registered for this event to leave a review',
      'review.invalid_rating': 'Rating must be between 1 and 5',
      
      // Favorite messages
      'favorite.added': 'Event added to favorites',
      'favorite.removed': 'Event removed from favorites',
      'favorite.already_added': 'Event already in favorites',
      
      // Search messages
      'search.no_results': 'No events found matching your criteria',
      'search.results_found': 'Found {{count}} events',
      
      // Validation messages
      'validation.required': '{{field}} is required',
      'validation.invalid_email': 'Invalid email format',
      'validation.invalid_location': 'Invalid location coordinates',
      'validation.invalid_date': 'Invalid date format',
      
      // Generic messages
      'success': 'Operation successful',
      'error': 'An error occurred',
      'not_found': 'Resource not found',
      'forbidden': 'Access forbidden'
    }
  },
  es: {
    translation: {
      'auth.register_success': 'Registro de usuario exitoso',
      'auth.login_success': 'Inicio de sesión exitoso',
      'auth.invalid_credentials': 'Email o contraseña inválidos',
      'auth.user_exists': 'El usuario con este email ya existe',
      'auth.password_changed': 'Contraseña cambiada exitosamente',
      'auth.unauthorized': 'Acceso no autorizado',
      
      'event.created': 'Evento creado exitosamente',
      'event.updated': 'Evento actualizado exitosamente',
      'event.deleted': 'Evento eliminado exitosamente',
      'event.not_found': 'Evento no encontrado',
      'event.at_capacity': 'El evento está lleno',
      'event.registered': 'Registrado para el evento exitosamente',
      'event.unregistered': 'Desregistrado del evento exitosamente',
      'event.already_registered': 'Ya estás registrado para este evento',
      
      'review.created': 'Reseña enviada exitosamente',
      'review.updated': 'Reseña actualizada exitosamente',
      'review.deleted': 'Reseña eliminada exitosamente',
      'review.must_attend': 'Debes estar registrado para el evento para dejar una reseña',
      'review.invalid_rating': 'La calificación debe estar entre 1 y 5',
      
      'favorite.added': 'Evento agregado a favoritos',
      'favorite.removed': 'Evento eliminado de favoritos',
      'favorite.already_added': 'El evento ya está en favoritos',
      
      'search.no_results': 'No se encontraron eventos que coincidan',
      'search.results_found': 'Se encontraron {{count}} eventos',
      
      'validation.required': '{{field}} es requerido',
      'validation.invalid_email': 'Formato de email inválido',
      'validation.invalid_location': 'Coordenadas de ubicación inválidas',
      'validation.invalid_date': 'Formato de fecha inválido',
      
      'success': 'Operación exitosa',
      'error': 'Ocurrió un error',
      'not_found': 'Recurso no encontrado',
      'forbidden': 'Acceso denegado'
    }
  },
  fr: {
    translation: {
      'auth.register_success': 'Enregistrement utilisateur réussi',
      'auth.login_success': 'Connexion réussie',
      'auth.invalid_credentials': 'Email ou mot de passe invalide',
      'auth.user_exists': 'Cet utilisateur existe déjà',
      'auth.password_changed': 'Mot de passe changé avec succès',
      'auth.unauthorized': 'Accès non autorisé',
      
      'event.created': 'Événement créé avec succès',
      'event.updated': 'Événement mis à jour avec succès',
      'event.deleted': 'Événement supprimé avec succès',
      'event.not_found': 'Événement non trouvé',
      'event.at_capacity': 'L\'événement est complet',
      'event.registered': 'Inscription à l\'événement réussie',
      'event.unregistered': 'Désinscription de l\'événement réussie',
      'event.already_registered': 'Vous êtes déjà inscrit à cet événement',
      
      'review.created': 'Avis soumis avec succès',
      'review.updated': 'Avis mis à jour avec succès',
      'review.deleted': 'Avis supprimé avec succès',
      'review.must_attend': 'Vous devez être inscrit pour laisser un avis',
      'review.invalid_rating': 'La note doit être entre 1 et 5',
      
      'favorite.added': 'Événement ajouté aux favoris',
      'favorite.removed': 'Événement retiré des favoris',
      'favorite.already_added': 'L\'événement est déjà dans les favoris',
      
      'search.no_results': 'Aucun événement trouvé',
      'search.results_found': '{{count}} événements trouvés',
      
      'validation.required': '{{field}} est requis',
      'validation.invalid_email': 'Format d\'email invalide',
      'validation.invalid_location': 'Coordonnées invalides',
      'validation.invalid_date': 'Format de date invalide',
      
      'success': 'Opération réussie',
      'error': 'Une erreur s\'est produite',
      'not_found': 'Ressource non trouvée',
      'forbidden': 'Accès refusé'
    }
  },
  de: {
    translation: {
      'auth.register_success': 'Benutzerregistrierung erfolgreich',
      'auth.login_success': 'Anmeldung erfolgreich',
      'auth.invalid_credentials': 'Ungültige E-Mail oder Passwort',
      'auth.user_exists': 'Benutzer mit dieser E-Mail existiert bereits',
      'auth.password_changed': 'Passwort erfolgreich geändert',
      'auth.unauthorized': 'Zugriff nicht autorisiert',
      
      'event.created': 'Veranstaltung erfolgreich erstellt',
      'event.updated': 'Veranstaltung erfolgreich aktualisiert',
      'event.deleted': 'Veranstaltung erfolgreich gelöscht',
      'event.not_found': 'Veranstaltung nicht gefunden',
      'event.at_capacity': 'Veranstaltung ist voll',
      'event.registered': 'Erfolgreich für die Veranstaltung angemeldet',
      'event.unregistered': 'Erfolgreich von der Veranstaltung abgemeldet',
      'event.already_registered': 'Sie sind bereits für diese Veranstaltung angemeldet',
      
      'review.created': 'Bewertung erfolgreich eingereicht',
      'review.updated': 'Bewertung erfolgreich aktualisiert',
      'review.deleted': 'Bewertung erfolgreich gelöscht',
      'review.must_attend': 'Sie müssen angemeldet sein, um eine Bewertung zu schreiben',
      'review.invalid_rating': 'Bewertung muss zwischen 1 und 5 liegen',
      
      'favorite.added': 'Veranstaltung zu Favoriten hinzugefügt',
      'favorite.removed': 'Veranstaltung aus Favoriten entfernt',
      'favorite.already_added': 'Veranstaltung ist bereits in Favoriten',
      
      'search.no_results': 'Keine Veranstaltungen gefunden',
      'search.results_found': '{{count}} Veranstaltungen gefunden',
      
      'validation.required': '{{field}} ist erforderlich',
      'validation.invalid_email': 'Ungültiges E-Mail-Format',
      'validation.invalid_location': 'Ungültige Koordinaten',
      'validation.invalid_date': 'Ungültiges Datumsformat',
      
      'success': 'Erfolgreich abgeschlossen',
      'error': 'Ein Fehler ist aufgetreten',
      'not_found': 'Ressource nicht gefunden',
      'forbidden': 'Zugriff verweigert'
    }
  }
};

i18next.init({
  resources,
  fallbackLng: process.env.DEFAULT_LANGUAGE || 'en',
  supportedLngs: (process.env.SUPPORTED_LANGUAGES || 'en,es,fr,de').split(','),
  interpolation: {
    escapeValue: false
  }
});

// Middleware for Express
const i18nMiddleware = new middleware.LanguageDetector();

module.exports = { i18next, i18nMiddleware };
