import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { submitter } from 'App/Helpers/Submitter'
import { ChunkSubmittedInterface } from 'App/Interfaces/ChunkSubmitted'

export default class ChunksController {
  // Create the post tx endpoint
  public async post({ request, response }: HttpContextContract) {
    const chunk = request.body() as ChunkSubmittedInterface
    const res = await submitter('chunk', chunk)

    if (res && res.length > 1) {
      return response.created('OK')
    } else if (res && res.length === 1) {
      // Transaction already on the weave
      return response.conflict('Transaction is already on the weave.')
    } else {
      return response.status(404).send({
        error: 404,
        errorMessage: 'Unable to post transaction',
      })
    }
  }
}
