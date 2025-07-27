import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit3, Trash2, Save, X, Eye, EyeOff, Key, Shield } from 'lucide-react';

interface AttendanceUser {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'attendant';
  isActive: boolean;
  createdAt: string;
  operator?: string;
}

const AttendanceCredentialsManager: React.FC = () => {
  const [users, setUsers] = useState<AttendanceUser[]>([]);
  const [editingUser, setEditingUser] = useState<AttendanceUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load users from localStorage
  useEffect(() => {
    const savedUsers = localStorage.getItem('attendance_users');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        initializeDefaultUsers();
      }
    } else {
      initializeDefaultUsers();
    }
  }, []);

  // Initialize default users
  const initializeDefaultUsers = () => {
    const defaultUsers: AttendanceUser[] = [
      {
        id: '1',
        username: 'admin',
        password: 'elite2024',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        operator: 'Sistema'
      },
      {
        id: '2',
        username: 'carol',
        password: 'elite2024',
        role: 'attendant',
        isActive: true,
        createdAt: new Date().toISOString(),
        operator: 'Carol Silva'
      },
      {
        id: '3',
        username: 'sara',
        password: 'elite2024',
        role: 'attendant',
        isActive: true,
        createdAt: new Date().toISOString(),
        operator: 'Sara Santos'
      }
    ];
    setUsers(defaultUsers);
    saveUsers(defaultUsers);
  };

  // Save users to localStorage
  const saveUsers = (userList: AttendanceUser[]) => {
    localStorage.setItem('attendance_users', JSON.stringify(userList));
    
    // Also update the useAttendance hook data
    const attendanceCredentials = {
      users: userList
        .filter(user => user.isActive)
        .map(user => ({
          username: user.username,
          password: user.password,
          role: user.role
        }))
    };
    localStorage.setItem('attendance_credentials', JSON.stringify(attendanceCredentials));
  };

  const handleCreate = () => {
    setEditingUser({
      id: Date.now().toString(),
      username: '',
      password: '',
      role: 'attendant',
      isActive: true,
      createdAt: new Date().toISOString(),
      operator: ''
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editingUser) return;

    if (!editingUser.username.trim() || !editingUser.password.trim()) {
      alert('Username e senha são obrigatórios');
      return;
    }

    // Check for duplicate username
    const existingUser = users.find(u => 
      u.username.toLowerCase() === editingUser.username.toLowerCase() && 
      u.id !== editingUser.id
    );
    
    if (existingUser) {
      alert('Username já existe. Escolha outro.');
      return;
    }

    setSaving(true);
    
    setTimeout(() => {
      let updatedUsers;
      
      if (isCreating) {
        updatedUsers = [...users, editingUser];
      } else {
        updatedUsers = users.map(u => u.id === editingUser.id ? editingUser : u);
      }
      
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
      
      setEditingUser(null);
      setIsCreating(false);
      setSaving(false);
      
      // Show success message
      const message = isCreating ? 'Usuário criado com sucesso!' : 'Usuário atualizado com sucesso!';
      showSuccessMessage(message, editingUser.username);
    }, 500);
  };

  const handleDelete = (id: string, username: string) => {
    if (username === 'admin') {
      alert('Não é possível excluir o usuário admin');
      return;
    }
    
    if (confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) {
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
    }
  };

  const handleToggleActive = (user: AttendanceUser) => {
    if (user.username === 'admin') {
      alert('Não é possível desativar o usuário admin');
      return;
    }
    
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, isActive: !u.isActive } : u
    );
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  };

  const showSuccessMessage = (message: string, username: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out translate-x-full';
    notification.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl border border-green-200 p-6 max-w-sm w-full">
        <div class="flex items-start gap-4">
          <div class="bg-green-100 rounded-full p-3 flex-shrink-0">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-gray-900 mb-2">
              ✅ ${message}
            </h3>
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p class="text-sm font-medium text-blue-800 mb-1">
                👤 Username:
              </p>
              <code class="bg-white px-3 py-1 rounded-md font-mono text-lg font-bold text-purple-700 border border-purple-200">
                ${username}
              </code>
            </div>
            <button 
              onclick="this.closest('.fixed').remove()" 
              class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
      notification.classList.add('translate-x-0');
    }, 100);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 500);
      }
    }, 5000);
  };

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? 'Administrador' : 'Atendente';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Shield size={24} className="text-purple-600" />
            Credenciais de Atendimento
          </h2>
          <p className="text-gray-600">Gerencie usuários que podem acessar o painel de atendimento</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Key size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Como Funciona</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Usuários criados aqui podem fazer login em <strong>/atendimento</strong></li>
              <li>• <strong>Admin:</strong> Acesso completo ao sistema</li>
              <li>• <strong>Atendente:</strong> Acesso aos pedidos e chat com clientes</li>
              <li>• Credenciais são salvas localmente no navegador</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Usuários Cadastrados ({users.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Username</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Operador</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Senha</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Função</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Criado em</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-800">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-700">{user.operator || 'Não informado'}</span>
                  </td>
                  <td className="py-4 px-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {user.password}
                    </code>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={user.username === 'admin'}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } ${user.username === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.isActive ? (
                        <>
                          <Eye size={12} />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setIsCreating(false);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar usuário"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        disabled={user.username === 'admin'}
                        className={`p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors ${
                          user.username === 'admin' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Excluir usuário"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum usuário cadastrado</p>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {isCreating ? 'Novo Usuário' : 'Editar Usuário'}
                </h2>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setIsCreating(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    username: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: joao"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Operador
                </label>
                <input
                  type="text"
                  value={editingUser.operator || ''}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    operator: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type="text"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    password: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: senha123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função *
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    role: e.target.value as 'admin' | 'attendant'
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="attendant">Atendente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      isActive: e.target.checked
                    })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Usuário ativo
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingUser.username.trim() || !editingUser.password.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isCreating ? 'Criar Usuário' : 'Salvar Alterações'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCredentialsManager;