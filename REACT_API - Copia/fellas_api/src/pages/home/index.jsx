import React, { useState, useRef } from 'react';
import axios from 'axios';
import './styles.css';
import MeteorShower from './meteorShower';

function Home() {
  const [dominiosVerificados, setDominiosVerificados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [disponivel, setDisponivel] = useState(false);

  const inputDominio = useRef();

  async function verificarDominio() {
    setCarregando(true);
    setErro(null);
    setDisponivel(false);

    const dominio = inputDominio.current.value.trim();
    console.log("Verificando domínio:", dominio);

    if (!dominio) {
      setErro("Por favor, insira um domínio válido.");
      setCarregando(false);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3001/api/domain/${dominio}`);
      
      if (response.data) {
        const dominioData = {
          ldhName: response.data.ldhName,
          status: response.data.status,
          createdDate: response.data.createdDate,
          expirationDate: response.data.expirationDate,
        };
        setDominiosVerificados([...dominiosVerificados, dominioData]);
      } else {
        setDisponivel(true);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setDisponivel(true);
      } else {
        setErro("Ocorreu um erro ao verificar o domínio.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className='dados'>
      <MeteorShower />
      <form>
        <h1 className='text-center'>Registrar Domínio</h1>
        <input placeholder='Domínio' name='dominio' type="text" ref={inputDominio} />
        <button type='button' onClick={verificarDominio}>Verificar</button>
      </form>

      {carregando && <p className="carregando">Carregando...</p>}
      {erro && <p>{erro}</p>}
      {disponivel && <p className="disponivel">O domínio está disponível!</p>}

      {/* Exibir a lista de domínios verificados */}
      {dominiosVerificados.length > 0 && (
        <div className='lista-dominios'>
          <h2>Domínios Verificados:</h2>
          <ul>
            {dominiosVerificados.map((dominio, index) => (
              <li key={index} className='card'>
                <p>Domínio: <span>{dominio.ldhName}</span></p>
                <p>Status: <span>{dominio.status}</span></p>
                <p>Data de Criação: <span>{dominio.createdDate}</span></p>
                <p>Data de Expiração: <span>{dominio.expirationDate}</span></p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Home;
