import {HttpRequest, RepresentationPreferences, AsyncHandler, ResponseDescription} from '@solid/community-server';


export interface ErrorHandlerArgs {
  error: Error;
  request?: HttpRequest;
  preferences: RepresentationPreferences;
}

/**
 * Converts an error into a {@link ResponseDescription} based on the request preferences.
 */
export abstract class ErrorHandler extends AsyncHandler<ErrorHandlerArgs, ResponseDescription> {}
