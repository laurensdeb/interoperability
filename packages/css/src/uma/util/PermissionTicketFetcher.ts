import {isString} from '../../util/StringGuard';
import {PermissionTicketRequest} from '../UmaClient';
import fetch from 'cross-fetch';


export type PermissionRequestOptions = {
    /**
     * Permission Registration Endpoint (required)
     */
    permission_registration_endpoint: string,
    /**
     * Bearer token for the Authorization header
     */
    bearer: string
}

/**
   * Method to fetch a ticket from the Permission Registration endpoint
   * of the UMA Authorization Service.
   *
   * @param {PermissionTicketRequest} request
   * @param {PermissionRequestOptions} options
   */
export async function fetchPermissionTicket({owner, ticketNeeds, ticketSubject}: PermissionTicketRequest,
    options: PermissionRequestOptions): Promise<string> {
  const ticketResponse = await fetch(options.permission_registration_endpoint,
      {method: 'POST',
        headers: {
          'Authorization': `Bearer ${options.bearer}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          resource_set_id: ticketSubject,
          scopes: [...ticketNeeds],
        }),
      });

  if (ticketResponse.status !== 200) {
    throw new Error(`Error while retrieving UMA Ticket: Received status ${ticketResponse.status} ` +
    `from '${options.permission_registration_endpoint}'.`);
  }

  const json = await ticketResponse.json();

  if (!json.ticket || !isString(json.ticket)) {
    throw new Error('Invalid response from UMA AS: missing or invalid \'ticket\'.');
  }

  return json.ticket;
}
