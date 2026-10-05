# Verificación — «Lo que cada tarea muestra de su responsable»

Requisito: `openspec/specs/tasks/spec.md`, «Lo que cada tarea muestra de su responsable».
Tests revisados: todos los de `backend/tests/` (`functional/auth/initials.spec.ts`, `login.spec.ts`, `session.spec.ts`, `signup.spec.ts`). No existe `backend/tests/unit/` ni ningún test que llame a una ruta de tareas.

Scenarios en el requisito: 3 · Cubiertos: 0

| Scenario | Test que lo cubre | Estado | Qué te faltó |
|---|---|---|---|
| Responsable identificable: el `assignee` de una tarea de "Ada Lovelace" trae su nombre y sus iniciales | — | No cubierto | |
| La tarea no filtra datos de cuenta: el `assignee` (tarea suelta o en la lista) no incluye email ni datos de acceso | — | No cubierto | |
| Responsable sin nombre: el nombre llega nulo y las iniciales siguen llegando | — | No cubierto | |

## Por qué ningún test cuenta, aunque alguno se parezca

- **Responsable identificable.** `Auth | iniciales › un nombre de dos palabras da la inicial de cada una` comprueba `initials === 'AL'` para "Ada Lovelace", pero lo hace sobre `data.user` de la respuesta de `POST /api/v1/auth/login`, no sobre el `assignee` de una tarea. Prueba el cálculo de las iniciales de la cuenta, no que la tarea las lleve.
- **La tarea no filtra datos de cuenta.** Ningún test obtiene una tarea. `Auth | registro › la contraseña nunca sale en la respuesta` solo comprueba que la contraseña no aparezca en el `user` del registro, y además ahí el email sí sale y debe salir. `Auth | sesión › el perfil devuelve la cuenta del token presentado` exige justo lo contrario que el scenario: que `email` esté presente en el perfil.
- **Responsable sin nombre.** `Auth | registro › una cuenta puede quedarse sin nombre` comprueba que `fullName` sea `null` en el `user` del registro, y `Auth | iniciales › sin nombre, las iniciales salen del email` comprueba `initials === 'AE'` en el login. Entre los dos cubren las dos piezas a nivel de cuenta, pero ninguno las mira dentro del `assignee` de una tarea, que es lo que pide el scenario.

Para cubrir el requisito hacen falta tests functional de `tasks` que lean `GET /api/v1/tasks` y `GET /api/v1/tasks/:id` y comprueben el `assignee`: `fullName` e `initials` presentes, `fullName` nulo con `initials` para una cuenta sin nombre, y `assert.notProperty(assignee, 'email')` (mejor aún, que sus claves sean exactamente `['id', 'fullName', 'initials']`, que es lo que hoy elige `TaskAssigneeTransformer`). Que ese transformer esté bien hecho no vale como cobertura: sin un test, nada impide que mañana alguien lo cambie por `UserTransformer` y la tarea pase a filtrar el email.
