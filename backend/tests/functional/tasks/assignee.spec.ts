import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: el responsable identificable, que la tarea no
 * filtre datos de la cuenta y el responsable sin nombre.
 *
 * Cada scenario se comprueba en las dos lecturas que devuelven tareas, la lista
 * y la tarea suelta: el requisito habla de «cada tarea», no de una de ellas.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function sesion(client: any) {
    await User.create({
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'secreto123',
    })

    const response = await client
      .post('/api/v1/auth/login')
      .json({ email: 'grace@example.com', password: 'secreto123' })

    return response.body().data.token as string
  }

  async function tareaDe(fullName: string | null, email: string) {
    const responsable = await User.create({ fullName, email, password: 'secreto123' })
    return Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: responsable.id,
    })
  }

  /**
   * El `assignee` de la tarea en la lista y en su lectura suelta, en ese orden.
   */
  async function responsables(client: any, token: string, task: Task) {
    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)
    lista.assertStatus(200)

    const enLista = lista.body().data.find((t: { id: number }) => t.id === task.id)

    const suelta = await client
      .get(`/api/v1/tasks/${task.id}`)
      .qs({ today: '2026-10-05' })
      .header('Authorization', `Bearer ${token}`)
    suelta.assertStatus(200)

    return [enLista.assignee, suelta.body().data.assignee]
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const token = await sesion(client)
    const task = await tareaDe('Ada Lovelace', 'ada@example.com')

    for (const assignee of await responsables(client, token, task)) {
      assert.equal(assignee.fullName, 'Ada Lovelace')
      assert.equal(assignee.initials, 'AL')
    }
  })

  test('el responsable no trae el email ni ningún dato de la cuenta', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const task = await tareaDe('Ada Lovelace', 'ada@example.com')

    // Comprobar solo la ausencia de `email` dejaría pasar cualquier otro dato
    // de la cuenta que se colara mañana: se fija el conjunto exacto de claves.
    for (const assignee of await responsables(client, token, task)) {
      assert.notProperty(assignee, 'email')
      assert.notInclude(JSON.stringify(assignee), 'ada@example.com')
      assert.sameMembers(Object.keys(assignee), ['id', 'fullName', 'initials'])
    }
  })

  test('un responsable sin nombre llega con el nombre nulo y sus iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const task = await tareaDe(null, 'ada@example.com')

    for (const assignee of await responsables(client, token, task)) {
      assert.property(assignee, 'fullName')
      assert.isNull(assignee.fullName)
      assert.equal(assignee.initials, 'AE')
    }
  })
})
