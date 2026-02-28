import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return new Response('ok', {
		status: 200,
		headers: {
			'content-type': 'text/plain'
		}
	});
};
